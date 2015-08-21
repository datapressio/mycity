// See https://github.com/petehunt/webpack-howto to learn about
// these settings

var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");


module.exports = {
  entry: {

    'test-mycity-bbox': './src/test/test-mycity-bbox',
    'test-mycity-data': './src/test/test-mycity-data',
    'test-mycity-map-location': './src/test/test-mycity-map-location',
    'test-mycity-map-polygon': './src/test/test-mycity-map-polygon',
    'test-mycity-modifiers': './src/test/test-mycity-modifiers',
    'test-mycity-slider': './src/test/test-mycity-slider',
    'test-mycity-themes': './src/test/test-mycity-themes',

  },

  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'build'),
    publicPath: 'build/'
  },

  module: {
    loaders: [
      { test: /\.css$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader") },
      { test: /\.less$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader!less-loader") },
      { test: /\.scss$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader!sass-loader") },
      { test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'url-loader?limit=10000&minetype=application/font-woff' },
      { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader' },
      { test: /\.jsx$/, loaders: ['react-hot-loader', 'babel'], exclude: /node_modules/ },
      { test: /\.js$/, loaders: ['react-hot-loader', 'babel'], exclude: /node_modules/ },
      { test: /\.png$/, loaders: ['url-loader?limit=10000']},
      { test: /\.json$/, loaders: ['json'], exclude: /node_modules/ }
    ]
  },

  resolve: {
    // you can now require('file') instead of require('file.coffee')
    extensions: ['', '.js', '.jsx', '.json'] 
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin('common.js'),
    new ExtractTextPlugin("[name].css")
  ]
};

