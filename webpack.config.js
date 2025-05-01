const path = require('path');
const ExtensionManifestPlugin = require('webpack-extension-manifest-plugin');
const webpack = require('webpack'); // Required for ProvidePlugin
const JavaScriptObfuscator = require('webpack-obfuscator'); // Import the obfuscator


module.exports = {
  mode: 'production',
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
    new JavaScriptObfuscator({  // Add the obfuscator plugin
      rotateStringArray: true
    }, ['**/test.js']) //exclude test.js
  ],
  devtool: 'source-map',
};


