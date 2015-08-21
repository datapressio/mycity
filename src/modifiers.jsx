var addModifierWeightings = function(cards, modifiers) {
  var numActive = 0;
  for (var i=0; i<cards.length; i++) {
    if (!cards[i].disabled) {
      numActive += 1;
    }
  }
  var newCards = [];
  var next = 0;
  for (var i=0; i<cards.length; i++) {
    var newCard = {};
    for (var k in cards[i]) {
      if (cards[i].hasOwnProperty(k)) {
        newCard[k] = cards[i][k];
      }
    }
    if (cards[i].disabled) {
      newCard.weighting = 0;
    } else {
      newCard.weighting = modifiers[numActive-1][next]/100.0;
      next = next + 1;
    }
    newCards.push(newCard);
  }
  return newCards;
};

module.exports = addModifierWeightings;
