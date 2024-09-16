const path = require("path");
const {merge} = require("webpack-merge");
const common = require("./webpack-common");
const CopyPlugin = require("copy-webpack-plugin");

const configuration = merge(common, {
  mode: "development",
  devtool: "eval-source-map",
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }
      return middlewares;
    },
    static: {
      directory: path.join(__dirname, "dist"),
    },
    devMiddleware: {
      writeToDisk: true,
    },
    compress: true,
    host: "0.0.0.0",
    port: 11000,
    historyApiFallback: true,
    hot: true,
    proxy: {
      '/api/**': {
        target: 'http://[::1]:8080',
        ws: true,
        changeOrigin: true
      }
    }
  }
});

module.exports = configuration;
