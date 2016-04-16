var app, bodyParser, config, cookieParser, express, mongoose, session;

express = require("express");

mongoose = require('mongoose');

cookieParser = require("cookie-parser");

bodyParser = require("body-parser");

session = require("express-session");

config = require("./config_utils");

config = config.backend;

app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(bodyParser.json());

app.use(session({
  secret: "dmiexp",
  resave: true,
  saveUninitialized: true
}));

module.exports = function(path) {
  app.set("views", path + "/build/frontend");
  app.use(express["static"](path + "/build/frontend/public"));
  app.use("/", require("./default"));
  app.get('*', function(req, res) {
    return res.send('Page not found');
  });
  return app;
};

mongoose.connect(config.mongodb_url, function(err) {
  if (err) {
    return console.log(err);
  }
});

mongoose.connection.on("connected", function() {
  return console.log("\n > Database connected\n");
});
