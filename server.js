const express = require("express");
const webpack = require('webpack');
const path = require('path');
const webpackDevMiddleware = require('webpack-dev-middleware');
const crypto = require('crypto');

var dotenv = require('dotenv').config({path: __dirname + '/.env'});

const app = express();
const config = require('./webpack.config.dev.js');
const compiler = webpack(config);

// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base.
app.use(webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath,
}));

app.use("/node_modules", express.static(__dirname + '/node_modules'));

// view engine setup
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

/* GET home page. */

app.get('/', function(req, res, next) {
	res.render('index.ejs');
});



// Serve the files on port 3000.
app.listen(3000, function () {
  console.log('Example app listening on port 3000!\n');
});
