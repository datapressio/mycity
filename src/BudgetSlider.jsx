var React = require('react');
var Slider = require('./Slider');


var BudgetSlider = React.createClass({

  render: function() {
    var self = this;
    return (
      <div className="mycity-slider">
        <Slider
          id={self.props.id}
          description={self.props.description}
          value={self.props.budget}
          min={50}
          max={1000}
          step={10}
          onSlide={self.props.onSlide}
        />
      </div>
    )
  }
});

module.exports = BudgetSlider;
