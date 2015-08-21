// See https://github.com/petehunt/webpack-howto to learn about
// these settings


var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: {
    'mycity': './src/mycity.jsx',
  },

  output: {
    filename: 'mycity.js',
    library: 'mycity',
    libraryTarget: 'var',
    path: path.join(__dirname, 'dist'),
    publicPath: 'dist/'
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
    extensions: ['', '.js', '.jsx', '.json'] 
  },

  plugins: [
    new ExtractTextPlugin("[name].css")
  ]
};
