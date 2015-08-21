var React = require('react');
var Sortable = require('sortablejs');

var debug = false;


var move = function (arr, old_index, new_index) {
  if (new_index >= arr.length) {
    var k = new_index - this.length;
    while ((k--) + 1) {
      arr.push(undefined);
    }
  }
  return this; // for testing purposes
};

var makeCards = function(cards, order) {
  // console.log('Making', cards, order);
  // var names = [];
  // for (var h in cards) {
  //   if (cards.hasOwnProperty(h)) {
  //     names.push(h);
  //   }
  // }
  var ourCards = [];
  for (var j=0; j<order.length; j++) {
    var card = {
      name: order[j].name,
      disabled: order[j].disabled,
    }
    // names.pop(names.indexOf(card.name));
    for (var k in cards[card.name]) {
      if (cards[card.name].hasOwnProperty(k)) {
        card[k] = cards[card.name][k];
      }
    }
    ourCards.push(card);
  }
  // // Add any that are missing as disabled ones
  // for (var i=0; i<names.length; i++) {
  //   var name = names[i];
  //   var card = {
  //     name: name,
  //     disabled: true,
  //   }
  //   for (var k in cards[name]) {
  //     // console.log(k, cards[name], order, disabled);
  //     if (cards[name].hasOwnProperty(k)) {
  //       card[k] = cards[name][k];
  //     }
  //   }
  //   ourCards.push(card);
  // }
  return ourCards;
};

var Themes = React.createClass({
  render: function() {
    var cards_ = makeCards(this.props.cards, this.props.order);
    return (
      <Container 
        onSort={this.props.onSort}
        cards={cards_}
        disabledBackground={'#334'}
      />
    )
  }
});

// Allow the native sortable to see the latest query
// var latestQuery = {};
var Container = React.createClass({

  componentWillUnmount() {
    if (debug) {
      console.log('Unmounting...', this.sortable);
    }
    this.sortable.destroy();
    this.sortable = null;
  },

  componentDidUpdate() {
    var curPriority = []
    this.props.cards.map(card => {
      curPriority.push(card.name);
    })
    this.sortable.sort(curPriority);
    if (debug) {
      console.info('Updated order order to:', curPriority);
    }
  },

  componentDidMount() {
    if (debug) {
      console.log('First creation of sortable...');
    }
    var list = this.getDOMNode();
    this.sortable = this.makeSortable(list, this.props.onSort);
  },

  makeSortable(list, onSort) {
    var sortable = Sortable.create(list, {
      sort: true,
      handle: ".drag-handle",
      ghostClass: "dragging",
      onEnd: function (e) {
        var order = [];
        for (var i=0; i<this.props.cards.length; i++) {
          var orderCard = {
            name: this.props.cards[i].name,
            disabled: this.props.cards[i].disabled
          }
          order.push(orderCard);
        }
        var moved = order[e.oldIndex]
        order.splice(e.newIndex, 0, order.splice(e.oldIndex, 1)[0]);
        if (debug) {
          console.info('New order order:', app.state, this.props.state, order);
        }
        onSort(order);
      }.bind(this)
    });
    return sortable;
  },

  shouldComponentUpdate(nextProps, nextState) {
    var curPriority = '';
    this.props.cards.map(card => {
      curPriority += card.name +'.'+card.disabled+','
    })
    var nextPriority = '';
    nextProps.cards.map(card => {
      nextPriority += card.name +'.'+card.disabled+','
    })
    if (nextPriority !== curPriority) {
      if (debug) {
        console.log('Need to update the themes order.');
      }
      return true;
    }
    return false;
  },

  handleChange: function(component) {
    var order = [];
    if (debug) {
      console.log(this.props.cards);
    }
    for (var i=0; i<this.props.cards.length; i++) {
      var orderCard = {
        name: this.props.cards[i].name,
        disabled: this.props.cards[i].disabled
      }
      if (debug) {
        console.log(component.props.name, orderCard.name);
      }
      if (component.props.name === orderCard.name) {
        if (component.props.disabled) {
          orderCard.disabled = false;
        } else {
          orderCard.disabled = true;
        }
      }
      order.push(orderCard);
    }
    if (debug) {
      console.log('Setting order', app.state, this.props.state, order);
    }
    this.props.onSort(order);
    return false;
  },

  render() {
    if (debug) {
      console.log('Cards:', this.props.cards);
    }
    var self = this;
    return (
      <ul id="priorities" className="block__list block__list_words">
        {
          this.props.cards.map(card => {
            if (debug) {
              console.log(card.name);
            }
            return (
              <Card
                key={card.name}
                name={card.name}
                text={card.text}
                background={card.background}
                icon={card.icon}
                disabled={card.disabled}
                disabledBackground={this.props.disabledBackground}
                onChange={self.handleChange}
              />
            );
          })
        }
      </ul>
    );
  }
});


var Card = React.createClass({

  render() {
    if (debug) {
      console.log('Card query:', this.props.query);
    }
    var opacity = 1;
    var newStyles = {
      opacity: opacity,
      background: this.props.background,
    }
    if (this.props.disabled) {
      newStyles['background'] = this.props.disabledBackground;
    }
    var textStyles = {
      cursor: 'move',
    }
    var img = (<span style={{width: 20, display: 'inline-block'}}></span>);
    if (this.props.disabled) {
      textStyles['textDecoration'] = 'line-through';
    } else {
      img = (<img src={this.props.icon} style={{width: '20px', cursor: 'move'}}/>)
    }
    var self = this;
    return (
      <li data-id={this.props.name}> {/* So we can manually re-sort after a change */}
        <div style={newStyles} className="card">
          <input
            type="checkbox"
            name={this.props.name}
            checked={!this.props.disabled}
            ref={this.props.name}
            onChange={function(e){return self.props.onChange(self);}}
            style={{position: "relative", top: "0px"}}
          />
          <span className="drag-handle">
            <span style={textStyles}>{this.props.text}</span>
            {img}
          </span>
        </div>
      </li>
    );
  }
});


var makeSerializeState = function(key) {
  return function(state) {
    if (debug) {
      console.log('Asked to save state:', JSON.stringify(state));
    }
    if (state[key]) {
      state[key] = state[key].map(card => {
        if (card.disabled) {
          return '!'+card.name;
        } else {
          return card.name;
        }
      }).join(',');
    } 
    return state;
  };
};


var makeParseState = function(key) {
  return function(state) {
    if (state[key] === '') {
      state[key] = [];
    } else {
      state[key] = state[key].split(',');
    }
    state[key] = state[key].map(str => {
      if (str.indexOf('!') === 0) {
        return {
          name: str.substr(1, str.length),
          disabled: true,
        }
      } else {
        return {
          name: str,
          disabled: false,
        }
      }
    });
    if (debug) {
      console.log('Got state:', state[key]);
      console.log('state:', state);
    }
    return state;
  };
};


module.exports = {
  Themes: Themes,
  makeParseState: makeParseState,
  makeSerializeState: makeSerializeState
};

