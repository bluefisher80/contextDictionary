const path = require('path');
const ExtensionManifestPlugin = require('webpack-extension-manifest-plugin');
const webpack = require('webpack'); // Required for ProvidePlugin

module.exports = {
  mode: 'development',
  entry: {
    background: './background.js',
    wordList: './wordList.js',
    lookup: './include/lookup.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  resolve: {
    fallback: {
    },
  },
  plugins: [

    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'], // Automatically provide Buffer
      process: 'process/browser',   // Automatically provide process
    }),
    new ExtensionManifestPlugin({
      config: {
        base: path.resolve(__dirname, 'manifest.json'),
      },
    }),
  ],
  devtool: 'source-map',
};


