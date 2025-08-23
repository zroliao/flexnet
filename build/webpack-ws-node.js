'use strict'

const path = require('path');
const webpack = require('webpack');

const rendererConfig = {
  mode: 'production',
  entry: {
    'index': './src/client-edge/ws-client-node.ts'
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
  name: 'wsnode',
  output: {
    path: path.resolve(__dirname, '../dist/wsnode'),
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
