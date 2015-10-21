var summary_resource_id = "a72ae909-56d1-4e2a-9d37-8abb0260775a";

var React = require('react');
var Controls = require('./Controls');
var Postcode = require('./Postcode');
var Map = require('./Map');
var Loading = require('./Loading');
var Popup = require('./Popup');
var BudgetSlider = require('./BudgetSlider');
var appHash = require('state-utils/src/apphash');
var parseSimpleCSV = require('state-utils/src/csv');
var request = require('state-utils/src/net');
var Themes = require('./themes').Themes;
var parseThemeState = require('./themes').makeParseState('theme');
var serializeThemeState = require('./themes').makeSerializeState('theme');
var bboxToFloat = require('./bbox').bboxToFloat;
var bboxQuery = require('./bbox').bboxQuery;


require('./app.scss');

var calculateBuckets = require('state-utils/src/buckets').calculateBuckets;
var addModifierWeightings = require('./modifiers');


var Shader = function(url, colName, colors, defaultOpacity, budgetColor, budgetOpacity, modifierConfig) {
  var self = this;
  self.budgetColor = budgetColor;
  self.budgetOpacity = budgetOpacity;
  self.defaultOpacity = defaultOpacity;
  self.url = url;
  self.colName = colName;
  self.colors = colors;
  self.modifierConfig = modifierConfig;

  self.data = undefined;
  self.sortedData = undefined; // Cache when calculating ranks
  self.buckets = undefined;
  self.mapAPI = undefined;

  self.lastEvent = null;
  self.lastBudget = null;
  self.lastWeightingsStr = null;
  self.polygonsToShade = [];

  self.expectedBuckets = 100;
  self.expectedMap = 25;

  self.loadFromURL({
    green_spac: 'green',
  }).then(function(){
    if (self.id && self.obtainedChunks) {
      self.obtainedChunks(self.id, 'shader.buckets', self.expectedBuckets);
    }
    self.expectedBuckets = 0;
  });
};

Shader.prototype.handleNewProps = function(props) {
  var self = this;
  // console.info('Set props' , props.id);
  self.id = props.id;
  self.obtainedChunks = props.obtainedChunks;
  self.setNumChunks = props.setNumChunks;
  // console.info('Setting shader percentage', self.expected, self.fetched);
  self.setNumChunks(props.id, 'shader.map', self.expectedMap);
  self.setNumChunks(props.id, 'shader.buckets', self.expectedBuckets);
  if (self.buckets) {
    self.obtainedChunks(props.id, 'shader.buckets', self.expectedBuckets);
  } else {
    self.obtainedChunks(props.id, 'shader.buckets', 0);
  }
};

Shader.prototype.loadFromURL = function(replacements) {
  var self = this;
  return request('GET', self.url).then((csv)=>{
    self.data = parseSimpleCSV(csv, self.colName, replacements).rows;
    console.info('Loaded summary info', self.lastEvent);
    if (self.lastEvent) {
      self.calculateRankings(self.lastEvent);
    }
  });
};

Shader.prototype.registerMapAPI = function(event) {
  var self = this;
  self.mapAPI = event.mapAPI;
  console.info('Set map API', self.mapAPI);
  if (self.id && self.obtainedChunks) {
    self.obtainedChunks(self.id, 'shader.map', self.expectedMap);
  }
  self.expectedMap = 0;
};

Shader.prototype.calculateIndividualRankings = function(themesToValue) {
  var self = this;
  // Prepare the result structure
  if (typeof self.sortedData === 'undefined') {
    self.sortedData = {};
  }
  // Add in data for each theme we care about, if it is missing
  for (var theme in themesToValue) {
    if (themesToValue.hasOwnProperty(theme)) {
      if (typeof self.sortedData[theme] === "undefined") {
        console.log('Generating rank order for '+theme);
        self.sortedData[theme] = [];
        for (var oa in self.data) {
          if (self.data.hasOwnProperty(oa)) {
            self.sortedData[theme].push(parseFloat(self.data[oa][theme]))
          }
        }
        self.sortedData[theme].sort();
      }
    }
  }
  // Iterate over the sorted data to find the position of our value
  var results = {}
  for (var theme in themesToValue) {
    if (themesToValue.hasOwnProperty(theme)) {
      results[theme]={'max': self.sortedData[theme].length};
      for (var i=0; i<self.sortedData[theme].length; i++) {
        // console.log(i, themesToValue[theme], self.sortedData[theme][i]);
        if (themesToValue[theme] > self.sortedData[theme][i]) {
          results[theme]['pos'] = i;
        } else {
          break;
        }
        if (typeof results[theme] === 'undefined') {
          console.error('Could not find the value "'+themesToValue[theme]+'" in the data for '+theme);
        }
      }
    }
  }
  return results;
};

Shader.prototype.calculateRankings = function(event) {
  var self = this;
  // We rely on the summary data having already been set in previous callbacks
  if (typeof self.data === "undefined") {
    console.info('Cannot calculate yet!', self.data)
    self.lastEvent = event;
    return;
  }
  console.info('Calculating rankings');

  self.lastEvent = null;
  var cardsWithModifierWeightings = addModifierWeightings(event.theme, self.modifierConfig);
  // console.info('Data', self.data['E00021772']);
  // Could base whether to do the calculations on the ranking, rather than just a theme change.
  //console.info('Cards', cardsWithModifierWeightings)
  // console.info(self.numBuckets);
  var lastWeightings = [];
  for (var i=0; i<cardsWithModifierWeightings.length; i++) {
    // if (cardsWithModifierWeightings[i].disabled) {
    // } else {
      lastWeightings.push([cardsWithModifierWeightings[i].weighting, cardsWithModifierWeightings[i].name])
    // }
  }
  window.lastWeightings = lastWeightings.sort();
  var lastWeightingsStr = '';
  for (var i=0; i<lastWeightings.length; i++) {
    lastWeightingsStr += lastWeightings[i][0]+':'+lastWeightings[i][1]+','
  }
  // console.log(lastWeightingsStr, self.lastWeightingsStr);
  self.budget = event.budget;
  if (lastWeightingsStr !== self.lastWeightingsStr) {
    self.lastWeightingsStr = lastWeightingsStr;
    // console.log(self.mapAPI.featuresOnDisplay);
    // var res = calculateBuckets(cardsWithModifierWeightings, self.data, self.colors.length, self.mapAPI.featuresOnDisplay);
    var res = calculateBuckets(cardsWithModifierWeightings, self.data, self.colors.length);
    self.buckets = res.bucketByKey;
    console.info(res.boundaries);
    self.boundaries = res.boundaries;
    // console.info('Bucket number: ', self.buckets['E00021772']);
    // We want to shade the polygons here too.
  } else {
    console.info('Rankings unchanged');
  }
  if (self.polygonsToShade.length) {
    self.shadeQueuedPolygons();
  }
  var counter = 0;
  for (var oa in self.mapAPI.featuresOnDisplay) {
    counter += 1;
    if (self.mapAPI.featuresOnDisplay.hasOwnProperty(oa)) {
      // console.log(event.budget, self.data[oa].Rent_per_m * (12/52));
      self._shadeOA(oa, self.mapAPI.featuresOnDisplay[oa]);
    }
  }
  console.log('Shaded ' + counter + ' features');
};

Shader.prototype.shadePolygon = function(id) {
  // console.log('Really shading the polygon');
  var self = this;
  if (typeof self.mapAPI === "undefined" || typeof self.buckets === "undefined") {
    if (self.polygonsToShade.indexOf(id) === -1) {
      console.log('Cannot shade it yet, waiting');
      self.polygonsToShade.push(id);
    }
  } else {
    if (self.polygonsToShade.length) {
      self.shadeQueuedPolygons();
    }
    self._shade(id);
    self.mapAPI.show(id);
  }
};

Shader.prototype.shadeQueuedPolygons = function() {
  var self = this;
  for (var i=0; i<self.polygonsToShade.length; i++) {
    // console.log('Shading backlog', id);
    self._shade(self.polygonsToShade[i]);
    self.mapAPI.show(self.polygonsToShade[i]);
  }
  self.polygonsToShade = [];
};

Shader.prototype._shade = function(id) {
  var self = this;
  var layer = self.mapAPI.layers[id];
  for (var sub_layer in layer._layers) {
    if (layer._layers.hasOwnProperty(sub_layer)) {
      var oa = layer._layers[sub_layer].feature.properties['OA11CD'];
      self._shadeOA(oa, layer._layers[sub_layer]);
    }
  }
};

Shader.prototype._shadeOA = function(oa, sub_layer) {
  var self = this;
  var opacity = self.defaultOpacity;
  // console.log(color, opacity);
  if (self.budget !== 1000 && self.budget < self.data[oa].Rent_per_m * (12/52)) {
    var color = this.budgetColor;
    opacity = self.budgetOpacity;
  } else {
    color = self.colors[self.buckets[oa]];
  }
  sub_layer.setStyle(
    {
      stroke: true,
      color: color,
      opacity: opacity,
      weight: 1, //0+((11-app.state.zoom)/6),
      // Fill
      fillOpacity: opacity,
      fillColor: color,
    }
  );
}


var BBox = function(url, colName, basePolygonURL, handleFeatureClick, shadePolygon, getClickData, calculateIndividualRankings) {
  var self = this;
  // Config
  self.url = url;
  self.colName = colName;
  self.basePolygonURL = basePolygonURL;
  self.handleFeatureClick = handleFeatureClick;
  self.getClickData = getClickData;
  self.shadePolygon = shadePolygon;
  self.calculateIndividualRankings = calculateIndividualRankings;

  // Props
  self.obtainedChunks = null;
  self.setNumChunks = null;
  self.id = null;
  self.lastBBox = null;
  self.setState = null;

  // Init State
  self.data = undefined;
  self.mapAPI = undefined;
  self.lastEvent = null;

  // State
  self.expected = null;
  self.fetched = null;
  self.expectedData = 100;
  self.expectedMap = 20;

  self.loadFromURL().then(function(){
    if (self.id && self.obtainedChunks) {
      self.obtainedChunks(self.id, 'bbox.data', self.expectedData);
    }
    self.expectedData = 0;
  });
};

/*
  We need to keep track of the latest ID, so we can stop unnecessary fetch tasks later
  We also need to set how far along the existing loading is against the new ID
*/
BBox.prototype.handleNewProps = function(props) {
  var self = this;
  // console.info('Set props' , props.id);
  self.obtainedChunks = props.obtainedChunks;
  self.setNumChunks = props.setNumChunks;
  self.setState = props.setState;
  self.id = props.id;
  console.info('Setting bbox percentage', self.expected, self.fetched);
  self.setNumChunks(props.id, 'bbox', self.expected);
  self.obtainedChunks(props.id, 'bbox', self.fetched);
  self.setNumChunks(props.id, 'bbox.data', self.expectedData);
  if (self.data) {
    self.obtainedChunks(props.id, 'bbox.data', self.expectedData);
  } else {
    self.obtainedChunks(props.id, 'bbox.data', 0);
  }
  self.setNumChunks(props.id, 'bbox.map', self.expectedMap);
  if (self.data) {
    self.obtainedChunks(props.id, 'bbox.map', self.expectedMap);
  } else {
    self.obtainedChunks(props.id, 'bbox.map', 0);
  }
  if (self.data && self.mapAPI && props.state.oa !== '' && self.oa !== props.state.oa) {
    self.oa = props.state.oa;
    var data = self.getClickData();
    self.handleFeatureClick(
      null,
      self.oa,
      null,
      null,
      data.summary,
      data.boundaries,
      self.calculateIndividualRankings,
      function() {
        self.setState({oa: ''});
      }
    );
  } else {
    self.oa = props.state.oa;
  }
};

/*
  Fetch the bbox data, and call the first fetch if the map and bbox are already available
*/
BBox.prototype.loadFromURL = function() {
  var self = this;
  return request('GET', self.url).then((csv)=>{
    self.data = bboxToFloat(self.colName, parseSimpleCSV(csv, undefined).rows);
    console.info('Set data', self.lastEvent, self.mapAPI);
    if (self.lastEvent && self.mapAPI) {
      self.fetchAndRenderPolygons(self.lastEvent);
    }
  });
}

BBox.prototype.registerMapAPI = function(event) {
  var self = this;
  self.mapAPI = event.mapAPI;
  console.info('Set map API', self.mapAPI);
  if (self.id && self.obtainedChunks) {
    self.obtainedChunks(self.id, 'bbox.map', self.expectedMap);
  }
  self.expectedMap = 0;
  if (self.lastEvent && self.data) {
    self.fetchAndRenderPolygons(self.lastEvent);
  }
}

BBox.prototype.fetchAndRenderPolygons = function(event) {
  var self = this;

  // We rely on the bbox, data, and lsoaColName having already been set in previous callbacks
  if (typeof self.data === "undefined" || typeof self.mapAPI === "undefined") {
    console.info('Cannot plot yet!', self.data, self.mapAPI);
    // Save this state for as soon as we can plot
    self.lastEvent = event;
    return;
  }
  // Prevent this method being called again from registerMapAPI or loadFromURL now that
  // everything is already loaded.
  // console.log(event);
  self.lastEvent = null;

  // Create a copy of the variable for the closure
  var curBBox = self.curBBox = event.bbox.join(',');
  // Perform the calculation
  var results = bboxQuery(
    self.colName,
    self.data,
    event.bbox
  );
  console.log('LSOAs in bbox:', results);
  var toHide = self.mapAPI.hideOthers(results);
  console.log('To hide:', toHide);
  var status = self.mapAPI.status(results);
  self.fetched = 0;
  self.expected = status.missing.length;
  var id = self.id;
  console.info(id);
  // Reset the chunk count
  self.setNumChunks(id, 'bbox', self.expected);
  // Make sure any percentages are re-set
  self.obtainedChunks(id, 'bbox', self.fetched);
  console.log('BBOX Set percentage to', self.expected, self.fetched);
  console.log('To Fetch:', status.missing);
  var tasks = [];
  var parallel = 8;
  for (var i=0; i<parallel; i++) {
    tasks.push([]);
  }
  for (var i=0; i<status.missing.length; i++) {
    tasks[i%parallel].push(
      self.makeFetchTask(status.missing[i], curBBox)
    )
  }
  var promises = [];
  for (var i=0; i<parallel; i++) {
    promises.push(
      tasks[i].reduce(
        function(cur, next) {
          return cur.then(next);
        },
        Promise.resolve()
      )
    );
  }
  // Fetch the tasks
  Promise.all(promises).then(function() {
    console.log('All done! '+self.mapAPI.numShown() + ' polygons visible');
    if (self.fetched === self.expected) {
      console.log('Reset the percentage');
      self.fetched = 0;
      self.expected = 0;
    }
    if (self.oa) {
      var data = self.getClickData();
      return self.handleFeatureClick(
        null,
        self.oa,
        null,
        null,
        data.summary,
        data.boundaries,
        self.calculateIndividualRankings,
        function() {
          self.setState({oa: ''});
        }
      );
    }
  }).catch(alert);
  console.log('To show:', status.hidden);
  for (var i=0; i<status.hidden.length; i++) {
    if (self.shadePolygon) {
      self.shadePolygon(status.hidden[i]);
    } else {
      self.mapAPI.show(status.hidden[i]);
    }
  }
}

BBox.prototype.makeFetchTask = function(lsoa, startBBox) {
  var self = this;
  return function() {
    return new Promise(
      function(resolve, reject) {
        if (startBBox !== self.curBBox) {
          // console.error('Different start box');
          return resolve();
        }
        request('GET', self.basePolygonURL+lsoa+'.json').then(
          function(json) {
            if (startBBox !== self.curBBox) {
              // console.error('Different start box after JSON');
              return resolve();
            }
            var data = JSON.parse(json);
            self.mapAPI.register(lsoa, data, function(event, lsoa, subLayer) {
              var data = self.getClickData();
              var oa = subLayer.feature.properties['OA11CD'];
              self.setState({oa: oa});
              return self.handleFeatureClick(
                event,
                oa,
                lsoa,
                subLayer,
                data.summary,
                data.boundaries,
                self.calculateIndividualRankings,
                function() {
                  self.setState({oa: ''});
                }
              );
            });
            if (self.shadePolygon) {
              // console.log('Shading the polygon');
              self.shadePolygon(lsoa);
            } else {
              self.mapAPI.show(lsoa);
            }
            self.fetched += 1;
            // console.log('Obtained chunk', self.id, self.fetched);
            // Always log the percentage agaisnt the latest state, not the start one, because it might have changed.
            self.obtainedChunks(self.id, 'bbox', self.fetched);
            return resolve();
          }
        ).then(resolve);
      }
    );
  };
};


var App = React.createClass({
  componentWillMount: function() {
    var self = this;
  },

  handleMapViewChange: function (lat, lng, zoom) {
    var self = this;
    this.props.setState({lat: lat, lng: lng, zoom: zoom});
  },

  handleSetBudget: function(value) {
    var self = this;
    return self.props.setState({budget: value});
  },

  handleUpdateBudgetSliderDescription: function(value) {
    value = parseInt(value);
    var jsx;
    if (value !== 1000) {
      jsx = (
        <div>
          BUDGET PER PERSON: UP TO <div className="highlight">&pound;{value}&nbsp;pw</div>
        </div>
      )
    } else {
      jsx = (
        <div>DRAG THE SLIDER TO SET MAX BUDGET</div>
      )
    }
    return jsx;
  },

  handleSort: function(order) {
    var self = this;
    console.log('a', order);
    self.props.setState({theme: order});
  },

  hideControls: function(e) {
    var self = this;
    e.preventDefault();
    self.props.setState({controls: false});
  },

  render: function() {
    var self = this;
    var sidebarClass = '';
    console.log(self.props.changeState)
    if ('controls' in self.props.changeState) {
      if (self.props.state.controls) {
        sidebarClass = 'slide-in'
      } else {
        sidebarClass = 'slide-out'
      }
    }
    return (
      <div className="app">
        <Controls className={sidebarClass}>
          <img className="logo" src={self.props.logo} />
          <a className="mycity-sidebar-hide" onClick={self.hideControls}>Hide</a>
          <Postcode
            setState={self.props.setState}
          />
          <BudgetSlider
            id={self.props.id}
            budget={self.props.state.budget}
            onSlide={self.handleSetBudget}
            description={self.handleUpdateBudgetSliderDescription}
          />
          <Themes
            cards={self.props.cards}
            order={self.props.state.theme}
            disabledBackground={'rgb(77, 77, 77);'}
            onSort={self.handleSort}
          />
        </Controls>
        <Loading
          registerPercentage={self.props.registerPercentage}
        />
        <Popup />
        <Map
          attribution={self.props.attribution}
          onMapCreated={self.props.onMapCreated}
          onViewChange={self.handleMapViewChange}
          onBBoxChanged={self.props.onBBoxChanged}
          lat={self.props.state.lat}
          lng={self.props.state.lng}
          zoom={self.props.state.zoom}
          setNumChunks={self.props.setNumChunks}
          obtainedChunks={self.props.obtainedChunks}
          id={self.props.id}
          tileURL={self.props.tileURL}
        />
      </div>
    );
  }
});

var getFromDataStore = function(apiServer, resourceName, key, oa, resource_ids) {
  var filter = {};
  filter[key] = oa;
  var url = apiServer+'/api/3/action/datastore_search?resource_id='+encodeURIComponent(
    resource_ids[resourceName]
  )+'&filters='+encodeURIComponent(
    JSON.stringify(filter)
  );
  return request('GET', url).then(function(result) {
    return JSON.parse(result).result.records[0];
  });
};


var defaultConfig = {
  cards: {
    'travel': {
      text: 'Public Transport',
      icon: 'icon.png',
      background: '#eed645',
    },
    'green': {
      text: 'Number of Green Spaces',
      icon: 'icon.png',
      background: '#96bf31',
    },
    'safety': {
      text: 'Safety',
      icon: 'icon.png',
      background: '#5da7a8',
    },
    'schools': {
      text: 'Schools',
      icon: 'icon.png',
      background: '#db6b66',
    }
  },
  summaryURL: 'http://data.london.gov.uk/dataset/mylondon/'+summary_resource_id+'/download/summary.csv',
  summaryPrimaryColName: 'OA',
  colors: [
    'rgb(142,1,82)',
    'rgb(197,27,125)',
    'rgb(222,119,174)',
    'rgb(241,182,218)',
    'rgb(253,224,239)',
    'rgb(247,247,247)',
    'rgb(230,245,208)',
    'rgb(184,225,134)',
    'rgb(127,188,65)',
    'rgb(77,146,33)',
    'rgb(39,100,25)',
  ],
  logo: 'logo.png',
  opacity: 0.4,
  budgetColor: 'rgba(0,0,0,1)',
  budgetOpacity: 0.5,
  modifierWeightings: [
    [100],
    [66, 34],
    [45, 33, 22],
    [40, 30, 20, 10]
  ],
  bboxURL: 'http://files.datapress.io/london/dataset/mylondon/bbox-lsoa.csv',
  bboxPrimaryColName: 'lsoa',
  geoJSONBaseURL: 'http://geojson.datapress.io.s3.amazonaws.com/data/',
  handleFeatureClick: function(event, oa, lsoa, subLayer, summary, boundaries) {
    alert('No handleFeatureClick() function in the config')
  },
  App: App,
  defaults: {
    lat: "51.50479250125297",
    lng: "-0.07864236831665039",
    zoom: "15",
    budget: "1000",
    theme: "travel,green,safety,schools"
  },
  elemID: 'app',
  tileURL: 'https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
};


var run = function(configChanges) {
  var config = {};
  for (var k in defaultConfig) {
    if (defaultConfig.hasOwnProperty(k)) {
      config[k] = defaultConfig[k];
    }
  }
  for (var k in configChanges) {
    if (configChanges.hasOwnProperty(k)) {
      config[k] = configChanges[k];
    }
  }
  console.log(config);
  var shader = new Shader(
    config.summaryURL,
    config.summaryPrimaryColName,
    config.colors,
    config.opacity,
    config.budgetColor,
    config.budgetOpacity,
    config.modifierWeightings
  )

  var bbox = new BBox(
    config.bboxURL,
    config.bboxPrimaryColName,
    config.geoJSONBaseURL,
    config.handleFeatureClick,
    function(id) {shader.shadePolygon(id);},
    function() {return {summary: shader.data, boundaries: shader.boundaries};},
    function(themes) {return shader.calculateIndividualRankings(themes)}
  );

  var app = appHash(
    function(props) {
      // Always have this after the chance to render so that it never sets the percentage, but only re-sets it
      bbox.handleNewProps(props);
      shader.handleNewProps(props);
      // Callbacks
      // Tip: Notice that the main object is bound so that the callback has access to it correctly.
      props['onBBoxChanged'] = bbox.fetchAndRenderPolygons.bind(bbox);
      props['onMapCreated'] = function(event) {
        bbox.registerMapAPI(event);
        shader.registerMapAPI(event);
      }
      // Config
      props['cards'] = config.cards;
      props['tileURL'] = config.tileURL;
      props['logo'] = config.logo;
      props['attribution'] = config.attribution;
      console.log('about to render');
      var component = React.createElement(
        config.App,
        props
      );
      React.render(component, document.getElementById(config.elemID), function() {
        console.log('rendered');
        // Actions
        if ('theme' in props.changeState || 'budget' in props.changeState) {
          // Give the UI a tiny chance to respond first.
          setTimeout(
            function() {
              shader.calculateRankings({
                theme: props.state.theme,
                budget: props.state.budget,
              })
            },
            0
          );
        }
      });
    },
    {
      lat: config.defaults.lat || "51.50479250125297",
      lng: config.defaults.lng || "-0.07864236831665039",
      zoom: config.defaults.zoom || "15",
      budget: config.defaults.budget || "1000",
      theme: config.defaults.theme || "travel,green,safety,schools",
      controls: "1", // Controls
    },
    function(state) {
      state.lat = parseFloat(state.lat);
      state.lng = parseFloat(state.lng);
      state.zoom = parseFloat(state.zoom);
      state.budget = parseInt(state.budget);
      if (state.controls === '0') {
        state.controls = false;
      } else {
        state.controls = true;
      }
      state = parseThemeState(state);
      return state;
    },
    function(state) {
      state.lat = state.lat.toFixed(5);
      state.lng = state.lng.toFixed(5);
      state = serializeThemeState(state);
      if (state.controls === false) {
        state.controls = '0';
      } else if (typeof state.controls !== "undefined") {
        delete state.controls;
      }
      return state;
    }
  );
};


module.exports = {
  App: App,
  run: run,
  getFromDataStore: getFromDataStore
};
