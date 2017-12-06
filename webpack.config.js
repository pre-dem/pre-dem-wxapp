module.exports = {
  entry: __dirname + '/pre-dem-wxapp/main.js',
  output: {
    path: __dirname + 'PreDemWxappDemo/utils',
    filename: 'pre-dem-wxapp.js',
    library: 'predem',
    libraryTarget:'umd'
  }
}