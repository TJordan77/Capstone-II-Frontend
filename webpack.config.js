const path = require("path");
const webpack = require("webpack");
require("dotenv").config();
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

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
      REACT_APP_API_URL: "",                 // CHANGED: leave empty in dev so we use same-origin "/api" via proxy
      SOCKETS_URL: "http://localhost:8080",  // keep if need sockets; guarded in App.jsx (CHANGED to backend port/protocol)
      REACT_APP_AUTH0_DOMAIN: "",
      REACT_APP_AUTH0_CLIENT_ID: "",
      REACT_APP_AUTH0_AUDIENCE: "",
      // CHANGED: must be a string
      REACT_APP_GOOGLE_CLIENT_ID: "56346908203-utbffuivjnt9mjhhiv64qsmcg45djmd3.apps.googleusercontent.com",
    }),
    // Generate dist/index.html that loads main.js
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public/index.html"),
      inject: "body",
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: "public", to: ".", globOptions: { ignore: ["**/index.html"] } }],
    }),
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
    // ADDED: proxy API to backend so cookies/CSRF work on same-origin during dev
    proxy: [
      {
        context: ["/api"],
        target: "http://localhost:8080",
        changeOrigin: true,
        // ws: true, // enable if we turn on Socket.IO on the backend during dev
      },
    ],
    allowedHosts: "all", // ADDED: avoids host check issues when testing
  },
};
