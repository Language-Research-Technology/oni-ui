const path = require('node:path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const webpack = require('webpack');

require('dotenv').config({ path: '../.env' });

module.exports = {
  target: 'web',
  entry: ['./src/main.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[contenthash].js',
    publicPath: process.env.ASSET_PATH || 'http://localhost:11000/',
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {},
    }),
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: process.env.TITLE || 'Oni',
      template: './public/index.html',
      favicon: './public/favicon.ico',
    }),
    new VueLoaderPlugin(),
    new MiniCssExtractPlugin({ filename: '[contenthash].css' }),
    new CopyWebpackPlugin({
      patterns: [
        {
          // Copy the Swagger OAuth2 redirect file to the project root;
          // that file handles the OAuth2 redirect after authenticating the end-user.
          from: require.resolve('swagger-ui/dist/oauth2-redirect.html'),
          to: './',
        },
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '',
            },
          },
          'css-loader',
          // "style-loader",
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: ['postcss-url'],
              },
            },
          },
        ],
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              publicPath: '',
            },
          },
          'css-loader',
          'postcss-loader',
        ],
      },
      {
        test: /\.(svg|png|jp(e*)g|gif|mp4)?$/,
        type: 'asset/resource',
        // loader: "file-loader",
        // options: {
        //     name: "[contenthash].[ext]",
        //     esModule: false,
        // },
      },
      // {
      //     test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      //     loader: "url-loader",
      //     options: { limit: 10000, mimetype: " application/font-woff" },
      // },
      // { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: "file-loader" },
      {
        test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        type: 'asset/resource',
        // use: [
        //     {
        //         loader: "file-loader",
        //         options: {
        //             name: "[name].[ext]",
        //         },
        //     },
        // ],
      },
      {
        test: /\.mjs$/i,
        resolve: { byDependency: { esm: { fullySpecified: false } } },
      },
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      src: path.resolve(__dirname, 'src'),
      assets: path.resolve(__dirname, 'src/assets'),
      components: path.resolve(__dirname, 'src/components'),
    },
  },
};
