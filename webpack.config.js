const path = require('path');
const ExtensionManifestPlugin = require('webpack-extension-manifest-plugin');

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
  plugins: [
    new ExtensionManifestPlugin({
      config: {
        base: path.resolve(__dirname, 'manifest.json'),
      },
    }),
  ],
  devtool: 'source-map',
};