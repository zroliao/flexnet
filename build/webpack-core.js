'use strict'

const path = require('path');
const webpack = require('webpack');

const rendererConfig = {
  mode: 'production',
  entry: {
    'index': './src/main.ts'
  },
  externals: {
    'uWebSockets.js': 'uWebSockets.js',
    './node_datachannel.node': './node_datachannel.node',
    'pg': 'pg'
  },
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/
      },
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  },
  plugins: [],
  name: 'core',
  output: {
    path: path.resolve(__dirname, '../dist/core'),
    libraryTarget: 'umd',
    filename: '[name].js'
  },
  resolve: {
    alias: {},
    extensions: ['.ts', '.js', '.json']
  },
  target: "node"
};

/**
 * Adjust rendererConfig for development settings
 */
if (process.env.NODE_ENV !== 'production') {
  rendererConfig.devtool = true;
}

/**
 * Adjust rendererConfig for production settings
 */
if (process.env.NODE_ENV === 'production') {
  rendererConfig.devtool = false;
  rendererConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    })
  )
}

module.exports = rendererConfig;
