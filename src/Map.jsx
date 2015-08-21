var React = require('react');
var L = require('leaflet');
var throttle = require('state-utils/src/throttle');
require('../node_modules/leaflet/dist/leaflet.css');


var MapAPI = function(component) {
  var self = this;
  self.component = component;
  self.layers = {};
  self.onDisplay = {};
  self.featuresOnDisplay = {};
};

MapAPI.prototype.register = function (id, data, featureClick) {
  var self = this;
  if (typeof self.layers[id] !== "undefined") {
    throw "Already registered "+id;
  }
  self.layers[id] = L.geoJson(data, {});
  if (typeof featureClick !== "undefined") {
    self.addEventsToLayer(self.layers[id], id, featureClick);
  }
};

MapAPI.prototype.displayedFeatures = function() {
};

MapAPI.prototype.addEventsToLayer = function(layer, id, onClick) {
  var self = this;
  for (var subLayer in layer._layers) {
    if (layer._layers.hasOwnProperty(subLayer)) {
      layer._layers[subLayer].on(
        'click',
        function(id, subLayer) {
          return function(event) {
            return onClick(event, id, subLayer)
          }
        }(id, layer._layers[subLayer])
      );
    }
  }
};

MapAPI.prototype.isRegistered = function (id) {
  var self = this;
  return typeof self.layers[id] !== "undefined"
};

MapAPI.prototype.getLayer = function(id) {
  var self = this;
  if (typeof self.layers[id] === "undefined") {
    throw "No such layer "+id;
  }
  return self.layers[id];
}

MapAPI.prototype.show = function (id, style, key) {
  var self = this;
  if (typeof key === "undefined") {
    key = 'OA11CD';
  }
  if (self.onDisplay[id]) {
    throw 'Already showing layer '+id;
  }
  var layer = self.getLayer(id);
  if (typeof style !== 'undefined') {
    layer.setStyle(style);
  }
  self.component.map.addLayer(layer);
  self.onDisplay[id] = true;
  for (var subLayer in layer._layers) {
    if (layer._layers.hasOwnProperty(subLayer)) {
      self.featuresOnDisplay[layer._layers[subLayer].feature.properties[key]] = layer._layers[subLayer];
    }
  }
};

MapAPI.prototype.hide = function (id, key) {
  var self = this;
  if (typeof key === "undefined") {
    key = 'OA11CD';
  }
  if (!self.onDisplay[id]) {
    throw 'Not showing layer '+id;
  }
  var layer = self.getLayer(id);
  self.component.map.removeLayer(layer);
  delete self.onDisplay[id];
  for (var subLayer in layer._layers) {
    if (layer._layers.hasOwnProperty(subLayer)) {
      delete self.featuresOnDisplay[layer._layers[subLayer].feature.properties[key]];
    }
  }
};

MapAPI.prototype.status = function (required) {
  var self = this;
  var missing = [];
  var shown = [];
  var hidden = [];
  for (var i=0; i<required.length; i++) {
    var id = required[i];
    if (typeof self.layers[id] === "undefined") {
      missing.push(id);
    } else if (typeof self.onDisplay[id] === "undefined") {
      hidden.push(id);
    } else {
      shown.push(id);
    }
  }
  return {
    missing: missing,
    hidden: hidden,
    shown: shown
  }
};

MapAPI.prototype.numShown = function () {
  var self = this;
  var counter = 0;
  for (var id in self.onDisplay) {
    if (self.onDisplay.hasOwnProperty(id)) {
      counter += 1;
    }
  }
  return counter;
}

MapAPI.prototype.hideOthers = function (required) {
  var self = this;
  var toHide = [];
  for (var id in self.onDisplay) {
    if (self.onDisplay.hasOwnProperty(id)) {
      if (required.indexOf(id) === -1) {
        toHide.push(id);
        self.hide(id);
      }
    }
  }
  return toHide;
};


var Map = React.createClass({

  // All props are optional, since we specify defaults next
  propTypes: {
    // Can be changed later by setting new props
    zoom: React.PropTypes.number,
    lat: React.PropTypes.number,
    lon: React.PropTypes.number,
    // Considered configuration and fixed on first load
    className: React.PropTypes.string,
    minZoom: React.PropTypes.number,
    maxZoom: React.PropTypes.number,
    tileURL: React.PropTypes.string,
    updateTimeout: React.PropTypes.number,
    onViewChange: React.PropTypes.func,
    onBBoxChanged: React.PropTypes.func
  },

  getDefaultProps: function() {
    return {
      // Considered configuration and fixed on first load
      zoom: 15,
      lat: 51.558933462503568,
      lng: -0.007437539906282,
      // Fixed on first load
      className: 'map',
      minZoom: 10,
      maxZoom: 18,
      tileURL: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
          '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
          '© <a href="http://datapress.io">DataPress</a>',
      // In milliseconds
      updateTimeout: 1000,
    };
  },

  componentDidMount: function() {
    var self = this;
    // Set up the map
    // console.log('Component did mount');
    var center = [self.props.lat, self.props.lng];
    var map = L.map(
      self.getDOMNode(), {
        zoom: self.props.zoom,
        // We manually add a zoom control in a different place, so we don't
        // need the default one
        zoomControl: false,
      }
    ).setView(center, self.props.zoom);
    L.control.zoom(
      {
         position: 'bottomright'
      }
    ).addTo(map);
    L.tileLayer(
      self.props.tileURL,
      {
        minZoom: self.props.minZoom,
        maxZoom: self.props.maxZoom,
        attribution: self.props.attribution || '',
      }
    ).addTo(map); // This is what puts the map into the DOM
    map.on('move', self.onMapChange);
    map.on('zoomend', self.onMapChange);
    map.on('resize', self.onMapChange);
    self.map = map;
    if (self.props.onMapCreated) {
      self.mapAPI = new MapAPI(self);
      self.props.onMapCreated({mapAPI:self.mapAPI});
    }
    self.t = throttle(
      self.props.updateTimeout,
      function(lat, lng, zoom) {
        // console.log('Calling onViewChange');
        if (self.props.onViewChange) {
          self.props.onViewChange(
            lat,
            lng,
            zoom
          );
        }
      },
      function(lastArgs, nextArgs) {
        if (lastArgs.join(',') === nextArgs.join(',')) {
          // console.log('cmp false');
          return false;
        }
        // console.log('cmp true');
        return true;
      },
      self.props.updateTimeout
    );
    map.on('moveend', self.t.fireLast);
    self.throttledOnViewChange = self.t.throttled;
    if (typeof window.addEventListener === 'undefined') {
      document.body.onresize = function() {return self.onMapChange()};
    } else {
	  window.addEventListener('resize', function() {return self.onMapChange()});
    }
    // Notify the parent of the bbox for this lat, lng and zoom
    if (self.props.onBBoxChanged) {
      var bbox = map.getBounds();
      var bboxArray = [bbox.getWest(), bbox.getEast(), bbox.getNorth(), bbox.getSouth()]
      self.lastBBox = bboxArray.join(',');
      self.props.onBBoxChanged({bbox: bboxArray});
    }
  },

  componentWillReceiveProps: function(nextProps) {
    var self = this;
    console.log('Receiving props for map');
    if (nextProps.lat !== self.props.lat || nextProps.lng !== self.props.lng || nextProps.zoom !== self.props.zoom) {
      self.map.off('resize', self.onMapChange);
      self.map.off('move', self.onMapChange);
      self.map.off('moveend', self.t.fireLast);
      self.map.off('zoomend', self.onMapChange);
      self.map.setView(
        {lat: nextProps.lat, lng: nextProps.lng},
        nextProps.zoom,
        {reset: false, animate: false}
      );
      if (self.props.onBBoxChanged) {
        var bbox = self.map.getBounds();
        var bboxArray = [bbox.getWest(), bbox.getEast(), bbox.getNorth(), bbox.getSouth()]
        if (self.lastBBox !== bboxArray.join(',')) {
          self.lastBBox = bboxArray.join(',');
          self.props.onBBoxChanged({bbox: bboxArray});
        }
      }
      self.map.on('resize', self.onMapChange);
      self.map.on('move', self.onMapChange);
      self.map.on('zoomend', self.onMapChange);
      self.map.on('moveend', self.t.fireLast);
    }
  },

  componentWillUnmount: function() {
    var self = this;
    self.map.off('move', self.onMapChange);
    self.map.off('zoomend', self.onMapChange);
    self.map.off('resize', self.onMapChange);
    self.map.off('moveend', self.t.fireLast);
    if (typeof window.addEventListener === 'undefined') {
      document.body.onresize = undefined;
    } else {
      window.removeEventListener("resize", self.onMapChange);
    }
  },

  onMapChange: function(event) {
    var self = this;
    // console.log('On map change')
    var center = self.map.getCenter();
    var newZoom = self.map.getZoom();
    // console.log('Updating URL', center.lat, center.lng, newZoom);
    self.throttledOnViewChange(center.lat, center.lng, newZoom);
  },

  shoudldComponentUpdate() {
    return false;
  },

  render: function() {
    var self = this;
    return (
      <div className={self.props.className} />
    )
  },
});

module.exports = Map;
