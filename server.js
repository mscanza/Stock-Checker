'use strict';

var express     = require('express');
var bodyParser  = require('body-parser');
var expect      = require('chai').expect;
var cors        = require('cors');
var apiRoutes         = require('./routes/api.js');
var fccTestingRoutes  = require('./routes/fcctesting.js');
var runner            = require('./test-runner');
var app = express(); 
var MongoClient = require('mongodb');
const CONNECTION_STRING = process.env.DB;
var helmet = require('helmet');

app.use(helmet());
app.use(helmet.contentSecurityPolicy({directives: {defaultSrc: ["'self'", 'https://code.jquery.com/jquery-2.2.1.min.js'], scriptSrc:["'self'","'unsafe-inline'", 'https://code.jquery.com/jquery-2.2.1.min.js'],styleSrc: ["'self'", "'unsafe-inline'"], imgSrc: ['https://hyperdev.com/favicon-app.ico', 'http://glitch.com/favicon-app.ico']}}))
app.use('/public', express.static(process.cwd() + '/public'));

app.use(cors({origin: '*'})); //For FCC testing purposes only

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('trust proxy', true)


MongoClient.connect(CONNECTION_STRING, function(err, db){
    if (err) {
      return console.log(err)
    }
    console.log("Succesful Database Connection")
  
  //For FCC testing purposes
fccTestingRoutes(app);

//Routing for API 
apiRoutes(app, db); 
  
// 404 Not Found Middleware
app.use(function(req, res, next) {
  res.status(404)
    .type('text')
    .send('Not Found');
});
  
  //Start our server and tests!
app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port " + process.env.PORT);
  if(process.env.NODE_ENV==='test') {
    console.log('Running Tests...');
    setTimeout(function () {
      try {
        runner.run();
      } catch(e) {
        var error = e;
          console.log('Tests are not valid:');
          console.log(error);
      }
    }, 3500);
  }
});
  
})


module.exports = app; //for testing
