const path = require('path');
const ExtensionManifestPlugin = require('webpack-extension-manifest-plugin');
const webpack = require('webpack'); // Required for ProvidePlugin
const CopyWebpackPlugin = require('copy-webpack-plugin'); // Import the plugin
const TerserPlugin = require('terser-webpack-plugin');


module.exports = {
  mode: 'development',
  entry: {
    background: './background.js',
    wordList: './wordList.js',
    lookup: './include/lookup.js',
    options: './options/options.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean:true,
    hashFunction: 'xxhash64', // Use xxhash64 for better performance
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

  
optimization: {
    moduleIds: 'deterministic', // Use deterministic module IDs for better caching
    chunkIds: 'deterministic', // Use deterministic chunk IDs for better caching
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true, // Remove console logs in production
          },
          format: {
            comments: false, // Remove comments in production
          },
        },
        extractComments: false, // Do not extract comments to a separate file
      }),
    ],
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

    new CopyWebpackPlugin({ // Configure the plugin
      patterns: [
        { from: 'icon16.png', to: '' }, // Copy icons to root of dist\
        { from: 'icon32.png', to: '' }, // Copy icons to root of dist\
        { from: 'icon48.png', to: '' }, // Copy icons to root of dist\
        { from: 'icon128.png', to: '' }, // Copy icons to root of dist\
        { from: 'icon256.png', to: '' }, // Copy popup page
        { from: 'options/options.html', to: 'options.html' }, // Copy options page
        { from: 'options/options.css', to: 'options.css' }, // Copy options css
        { from: 'wordList.html', to: 'wordList.html' }, // Copy wordList page
        { from: 'wordList.css', to: 'wordList.css' }, // Copy wordList css\
        { from: 'style/*.*', to: '' }, // Copy any other files you need
        { from: 'img/*.*', to: '' } // Copy any other files you need
        
      ],
    })
  ],

  devtool: 'source-map',
};


