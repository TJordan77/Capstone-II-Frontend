const path = require("path");
const webpack = require("webpack");
require("dotenv").config();
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "./src/App.jsx",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "main.js",
    publicPath: "/",
  },
  devtool: "source-map",
  plugins: [
    new webpack.EnvironmentPlugin({
      NODE_ENV: "development",
      API_URL: "http://localhost:8080",
      SOCKETS_URL: "ws://localhost:8080",
      REACT_APP_AUTH0_DOMAIN: "",
      REACT_APP_AUTH0_CLIENT_ID: "",
      REACT_APP_AUTH0_AUDIENCE: "",
    }),
    new CopyWebpackPlugin({ patterns: [{ from: "public", to: "." }] }),
  ],
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-react"],
          },
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".jsx"],
  },
  devServer: {
    static: [
      { directory: path.join(__dirname, "public"), publicPath: "/" },
      { directory: path.join(__dirname, "dist"), publicPath: "/" },
    ],
    compress: true,
    historyApiFallback: true,
    port: 3000,
  },
};
