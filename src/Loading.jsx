var React = require('react');

var Loading = React.createClass({
  getInitialState: function() {
    return {percentage: -1};
  },

  componentWillMount: function() {
    this.props.registerPercentage(this.handlePercentageChange);
  },

  handlePercentageChange: function(percentage) {
    // console.log('Got percentage', percentage);
    this.setState({percentage: Math.floor(percentage)});
  },

  render: function() {
    if (this.state.percentage === -1) { 
      return null;
    } else if (this.state.percentage === 0) { 
      return <div id="loading">Loading ...</div>
    } else {
      return <div id="loading">Loading {this.state.percentage}%</div>
    }
  }
});

module.exports = Loading;
