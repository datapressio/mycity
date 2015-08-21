var React = require('react');

var Controls = React.createClass({
  render: function() {
    return (
      <div id="sidebar" className={this.props.className}>
        {this.props.children}
      </div>
    );
  }
});

module.exports = Controls;
