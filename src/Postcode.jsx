var React = require('react');
var request = require('state-utils/src/net');


var PostcodeNavigation = React.createClass({
  handleSubmit: function(e) {
    var self = this;
    e.preventDefault();
    var postcode = React.findDOMNode(self.refs['postcode']).value;
    request('GET', 'http://api.postcodes.io/postcodes/'+postcode).then((txt)=>{
      var data = JSON.parse(txt);
      self.props.setState({
        zoom: 15,
        lat: data.result.latitude,
        lng: data.result.longitude
      });
    }).catch(alert);
  },

  render: function() {
    return (
      <div id="postcode">
        <form onSubmit={this.handleSubmit}><input type="text" ref="postcode" placeholder="Postcode" /></form>
      </div>
    );
  }
});

module.exports = PostcodeNavigation;
