const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: 'production',
  context: path.resolve(__dirname),

  entry: {},
  output: {
    path: path.resolve(__dirname, 'public'),
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "../../spa/dist", to: "dist"},
        { from: "api", to: "api" },
      ],
    }),
  ],
}
