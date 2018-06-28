var path = require('path');

module.exports = {
  mode: 'development',
  entry: './app/app.js',
  output: {
    path: path.resolve(__dirname, 'app'),
    filename: 'bundle.js',
    publicPath: './app/'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  devServer: {
    port: 3000,
    publicPath: '/app/'
  }
};
