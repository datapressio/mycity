var query = function(key, polygons, query) {
  // console.log("Trying the query from the data: ", query, 'against:', polygons, 'with key', key);
  var screen_left = parseFloat(query[0]);
  var screen_right = parseFloat(query[1]);
  var screen_bottom = parseFloat(query[2]);
  var screen_top = parseFloat(query[3]);
  var matches = [];
  for (var i=0; i<polygons.length; i++) {
    var polygon = polygons[i];
    if (
      (
           ((screen_left <    polygon.left)    && (screen_right >  polygon.left))
        || ((screen_left <    polygon.right)   && (screen_right >  polygon.right))
        || ((screen_left >=   polygon.left)    && (screen_right <= polygon.right))
      ) && (
           ((screen_bottom <  polygon.bottom)  && (screen_top >    polygon.bottom))
        || ((screen_bottom <  polygon.top)     && (screen_top >    polygon.top))
        || ((screen_bottom >= polygon.bottom)  && (screen_top <=   polygon.top))
      )
    ) {
      matches.push(polygon[key]);
    }
  }
  return matches;
};

var bboxToFloat = function(key, polygons) {
  var result = [];
  for (var i=0; i<polygons.length; i++) {
    var polygon = {
      left: polygons[i].left,
      right: polygons[i].right,
      top: polygons[i].top,
      bottom: polygons[i].bottom,
    };
    polygon[key] = polygons[i][key];

    if (typeof polygon.left !== "number" && typeof polygon.left !== "string") {
      throw 'Unknown value "'+polygon.left+'" for "left" in row '+i;
    }
    if (typeof polygon.right !== "number" && typeof polygon.right !== "string") {
      throw 'Unknown value "'+polygon.right+'" for "right" in row '+i;
    }
    if (typeof polygon.top !== "number" && typeof polygon.top !== "string") {
      throw 'Unknown value "'+polygon.top+'" for "top" in row '+i;
    }
    if (typeof polygon.bottom !== "string" && typeof polygon.bottom !== "string") {
      throw 'Unknown value "'+polygon.bottom+'" for "bottom" in row '+i;
    }
    polygon.left = parseFloat(polygon.left);
    polygon.right = parseFloat(polygon.right);
    polygon.top = parseFloat(polygon.top);
    polygon.bottom = parseFloat(polygon.bottom);
    result.push(polygon);
  }
  return result;
};

module.exports = {
  bboxQuery: query,
  bboxToFloat: bboxToFloat
};
