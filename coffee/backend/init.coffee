express = require "express"
mongoose = require 'mongoose'
cookieParser = require "cookie-parser"
bodyParser = require "body-parser"
session = require "express-session"
config = require "./config_utils"
config = config.backend
app = express()

app.set "view engine", "ejs"    
app.use bodyParser.urlencoded extended: true   
app.use bodyParser.json()
app.use session 
	secret: "dmiexp"
	resave: true
	saveUninitialized: true

module.exports = (path) ->
	app.set "views", "#{path}/build/frontend"
	app.use express.static "#{path}/build/frontend/public"
	app.use "/", require "./default"
	app.get '*', (req, res) -> res.send 'Page not found'
	app

mongoose.connect config.mongodb_url, (err) ->
	console.log err if err

mongoose.connection.on "connected", () ->
	console.log "\n > Database connected\n"