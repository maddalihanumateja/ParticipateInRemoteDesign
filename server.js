//#region requires
const express = require("express");
const webpack = require('webpack');
const path = require('path');
const webpackDevMiddleware = require('webpack-dev-middleware');

const bodyParser = require('body-parser')
const crypto = require('crypto');
const cors = require('cors')
const config = require('./webpack.config.dev.js');

var dotenv = require('dotenv').config({path: __dirname + '/.env'});
//#endregion

//#region initialize variables and config
const app = express();
const compiler = webpack(config);

// Tell express to use the webpack-dev-middleware and use the webpack.config.js
// configuration file as a base.
app.use(webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath,
}));

app.use("/node_modules", express.static(__dirname + '/node_modules'));

app.use(bodyParser.json(), cors())
app.options('*', cors());


// view engine setup
app.set('views', path.join(__dirname, '/views'));
app.set('view engine', 'ejs');

//#endregion

//#region router for all app endpoints

/* GET home page. */

app.get('/', function(req, res, next) {
	res.render('index.ejs');
});

/* POST request with meeting details and response with zoom signature */
app.post('/zoom_sign', (req, res) => {
  
  const timestamp = new Date().getTime();
  const msg = Buffer.from(dotenv.parsed.API_KEY + req.body.meetingNumber + timestamp + req.body.role).toString('base64');
  const hash = crypto.createHmac('sha256', dotenv.parsed.API_SECRET).update(msg).digest('base64');
  const signature = Buffer.from(`${dotenv.parsed.API_KEY}.${req.body.meetingNumber}.${timestamp}.${req.body.role}.${hash}`).toString('base64');

  res.json({
    signature: signature,
    API_KEY: dotenv.parsed.API_KEY
  });
  console.log("Sent response");
})

//#endregion

// Serve the files on port 3000.
app.listen(3000, function () {
  console.log('Example app listening on port 3000!\n');
});
