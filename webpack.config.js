const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  entry: __dirname + '/pre-dem-wxapp/main.js',
  output: {
    path: __dirname + '/PreDemWxappDemo/utils',
    filename: 'pre-dem-wxapp.js',
    libraryTarget:'umd'
  },
  externals: {
    'pre-dem-wxapp-conf': './pre-dem-wxapp-conf.js'
  },
  plugins: [
    new UglifyJsPlugin()
  ]
}