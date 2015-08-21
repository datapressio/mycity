var React = require('react');
var BootstrapSlider = require('bootstrap-slider');
var throttle = require('state-utils/src/throttle');

require('../node_modules/bootstrap-slider/dist/css/bootstrap-slider.min.css');


var SliderJsSlider = React.createClass({

  propTypes: {
    id: React.PropTypes.string,
    min: React.PropTypes.number,
    max: React.PropTypes.number,
    step: React.PropTypes.number,
    value: React.PropTypes.number.isRequired,
    toolTip: React.PropTypes.bool,
    onSlide: React.PropTypes.func,
    description: React.PropTypes.func,
    throttle: React.PropTypes.number,
  },

  getDefaultProps: function() {
    return {
      min: 0,
      max: 100,
      step: 1,
      value: 50,
      toolTip: false,
      onSlide: function() {},
      description: function() {},
      throttle: 500,
    };
  },

  getInitialState: function() {
    return {value: this.props.value}
  },

  componentWillMount: function() {
    var self = this;
    self.ignoreChange = null;
    self.throttle = throttle(
      self.props.throttle,
      function(value) {
        self.ignoreChange = self.props.onSlide(value);
        console.info('Set slider value', value, self.ignoreChange);
      },
      function(lastArgs, nextArgs) {
        if (lastArgs.join(',') === nextArgs.join(',')) {
          return false;
        }
        return true;
      },
      this.props.throttle*2
    );
    self.onSlide = self.throttle.throttled;
  },

  componentWillUpdate: function(nextProps, nextState) {
    var self = this;
    if (!(self.ignoreChange && nextProps.id === self.ignoreChange) && nextState.value !== nextProps.value) {
      console.log('Slider componentWillReceiveProps()', self.ignoreChange, nextProps);
      nextState.value = nextProps.value;
    }
  },

  componentDidMount: function() {
    var self = this;
    var toolTip = self.props.toolTip ? 'show' : 'hide';

    self.slider = new BootstrapSlider(
      React.findDOMNode(self.refs.slider),
      {
        id: self.props.id,
        min: self.props.min,
        max: self.props.max,
        step: self.props.step,
        value: self.props.value,
        tooltip: toolTip
      }
    );
    
    self.slider.on('slide', function(event) {
      self.slider.setValue(event.value);
      self.setState({
        value: event.value
      });
      self.onSlide(event.value);
    });

    self.slider.on('slideStop', function(event) {
      self.slider.setValue(event.value);
      self.setState({
        value: event.value
      });
      self.onSlide(event.value);
      self.throttle.fireLast();
    });

  },

  render: function() {
    var description = this.props.description(this.state.value);
    return (
      <div>
        {description}
        <div ref="slider"/>
      </div>
    );
  }
});


module.exports = SliderJsSlider;
