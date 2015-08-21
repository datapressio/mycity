var mycity = require('./mycity');

var apiServer = "http://api.datapress.io";

var resource_ids = {
  "bbox"                                   : "d62ad9f3-4a5d-410b-993a-134c57ce52ee",
  "modelled_OA_rents"                      : "c16db584-f212-439f-b735-507fe6c49955",
  "MyLondon_traveltime_to_Bank_station_OA" : "c2e9ebc1-935b-460c-9361-293398d84fe5",
  "MyLondon_postcode_OA"                   : "94baeb22-9d31-4332-95ab-84d4aaf72f22",
  "MyLondon_LOAC_area_description_text_v3" : "3848d6af-bd5e-4317-8676-bbb857f773e0",
  "MyLondon_fare_zone_OA"                  : "5ff9ce59-2a77-456a-9ecc-f8fb80660ef1",
  "MyLondonSchoolsCatchmentv2"             : "98ec0962-af1a-49ad-ac10-47606f7794da"
}

var getPopupData = function(oa) {
  console.log('Creating promise');
  return Promise.all(
    [
      mycity.getFromDataStore(apiServer, 'modelled_OA_rents', 'OA11CD', oa),
      mycity.getFromDataStore(apiServer, 'MyLondon_traveltime_to_Bank_station_OA', 'OA11CD', oa),
      mycity.getFromDataStore(apiServer, 'MyLondon_postcode_OA', 'OA11CD', oa),
      mycity.getFromDataStore(apiServer, 'MyLondon_fare_zone_OA', 'OA11CD', oa),
      mycity.getFromDataStore(apiServer, 'MyLondonSchoolsCatchmentv2', 'OA11CD', oa),
      mycity.getFromDataStore(apiServer, 'MyLondon_LOAC_area_description_text_v3', 'OA11CD', oa),
      mycity.getFromDataStore(apiServer, 'bbox', 'oa', oa),
    ]
  ).then(function(values) {
    var keys = ['rent', 'travel', 'postcode', 'fareZone', 'schools', 'area', 'geo'];
    var result = {}
    for (var i=0; i<keys.length; i++) {
      result[keys[i]] = values[i];
    }
    return result;
  });
};

