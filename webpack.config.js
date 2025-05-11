const path = require('path');
const ExtensionManifestPlugin = require('webpack-extension-manifest-plugin');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => {
  const browser = env.browser || 'chrome';
  const isProduction = argv.mode === 'production';

  const manifestExtra = {};

  if (browser === 'chrome') {
    manifestExtra.background = { service_worker: "background.js" };
  } else {
    manifestExtra.background = { scripts: ["background.js"] };
  }

  const optimizationConfig = {
    moduleIds: 'deterministic',
    chunkIds: 'deterministic',
    minimize: isProduction, // Only minimize in production mode
    minimizer: [],
  };

  if (isProduction) {
    optimizationConfig.minimizer.push(
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: true,
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      })
    );
  }else {
    optimizationConfig.minimize = false; // Disable minimization in development mode
  }

  const devtool = isProduction ? false : 'source-map'; // Use source maps in development mode

  return {
    mode: isProduction ? 'production' : 'development', // Set mode based on isProduction
    devtool: devtool,
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
      hashFunction: 'xxhash64',
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
    optimization: optimizationConfig,
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      }),
      new ExtensionManifestPlugin({
        config: {
          base: path.resolve(__dirname, 'manifest.json'),
          extend: manifestExtra,
        },
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'icon16.png', to: '' },
          { from: 'icon32.png', to: '' },
          { from: 'icon48.png', to: '' },
          { from: 'icon128.png', to: '' },
          { from: 'icon256.png', to: '' },
          { from: 'options/options.html', to: 'options.html' },
          { from: 'options/options.css', to: 'options.css' },
          { from: 'wordList.html', to: 'wordList.html' },
          { from: 'wordList.css', to: '' },
          { from: 'img/*.*', to: '' },
        ],
      }),
    ],
  };
};