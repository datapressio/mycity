MyCity
======

MyCity helps web developers to build data maps of their city with interactive
data-popups for each area.

MyCity is open source and works in modern web browsers, including on tablets
and phones so that your community can access your data.

It was developed by James Gardner for Tom Ress (DataPress) and Paul Hodgson
(London DataStore) for the MyLondon project. They would love to see you build
on the project to make more data available to the public.

Customizing MyCity for your own project involves two stages:

* Configuring the core engine with your data sources and settings
* Implementing your own popup to display your data when a user clicks
  on a particular map area

You don't need to change the core MyCity code to use it, although since it is
Open Source, you are free to do so if you wish.

To see an example app built with MyCity, have a look at
http://mylondon.datapress.io

Tutorial
========

Will be added once MyCity is refactored out from MyLondon.

Browser Compatibility
---------------------

Data fetching in IE8 only works if all your URLs have the same scheme as the
host. So for example, if you server your app from http, all the data sources
must be http. It is just one of those strange IE browser quirks.

Developers
==========

If you are contributing to MyCity core, you'll need to read this section. If
you just want to use MyCity in your own project, please follow the instructions
in the Tutorial above.

Install
-------

Install node and npm if you need to and set up the path.

On linux:

~~~
wget http://nodejs.org/dist/v0.10.33/node-v0.10.33-linux-x64.tar.gz
tar zxfv node-v0.10.33-linux-x64.tar.gz
export PATH=$PATH:node-v0.10.33-linux-x64/bin/
~~~

On Mac:

~~~
brew install node
~~~

Get the code:

~~~
git clone git@bitbucket.org:datapressio/mycity.git
cd mycity
~~~

Build the NPM dependencies and fetch the JS dependencies we need:

~~~
npm install
~~~

Now fetch the polyfills for IE:

~~~
./node_modules/bower/bin/bower install
~~~

Note that there is a `.bowerrc` file in the root directory that specifies where
bower should put the scripts. If this is missing you'll need to move
`bower_components` into `build/bower_components`


Build the project:

~~~
npm run lib
~~~

For a debug build (with source map) you can use:

~~~
npm run lib-debug
~~~

This will produce the `dist/mycity.js` and `dist/mycity.css` files for you to use in your project.

Sample app:

~~~
<!DOCTYPE html>
<html lang="en">
  <head>
    <title>MyLondon</title>
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Start MyCity -->
    <script src="mycity.js"></script>
    <link rel="stylesheet" href="mycity.css" />
    <!-- End MyCity -->
  </head>
  <body>
    <div id="app"></div>
    <script>
      mycity.run({
        handleFeatureClick: function(event, oa, lsoa, subLayer, summary, boundaries) {
          alert('Popup');
        }
      });
    </script>
  </body>
</html>
~~~

If you save this in the `dist` directory you will be able to serve the app from that directory:

~~~
python -m SimpleHTTPServer
~~~

Visit http://localhost:8000/.

Usually you would fetch data in the popup:

~~~
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

getPopupData(oa).then(function(data) {
  console.log(data)
});
~~~

In addition to the `handleFeatureClick` setting used in `mycity.run()` there are the following config options, with this as their default values. You can set any of these variables to customise the app:

~~~
{
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
  logo: 'logo.png',
  summaryURL: 'http://files.datapress.io/london/dataset/mylondon/summary.csv',
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
~~~
