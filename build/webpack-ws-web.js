'use strict'

const path = require('path');
const webpack = require('webpack');

const rendererConfig = {
  mode: 'production',
  entry: {
    'index': './src/browser/ws-client-web.ts'
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
  name: 'wsweb',
  externals: ["fs", "path"],
  output: {
    path: path.resolve(__dirname, '../dist/wsweb'),
    libraryTarget: 'umd',
    library: "wsweb",
    filename: '[name].js'
  },
  resolve: {
    alias: {},
    extensions: ['.ts', '.js', '.json']
  },
  target: "web"
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
