var Heroku = require('heroku-client'),
    heroku = new Heroku({ token: process.env.HEROKU_API_TOKEN });

var express = require('express');
var request = require('request');
var argv    = require('optimist').argv;
var assets = require('./config/assets')

var port = argv.port || process.env.PORT || 5000;
var app = express()

app.set("views", __dirname + "/views")
app.set("view options", { layout: false, pretty: true })
app.set("view engine", "jade")
app.use(express.bodyParser())
app.use(express.json())
app.use(express.urlencoded())
app.use(express.methodOverride())

app.get('/', function(req, res) {

   res.render('home')
})

app.use(app.router);


app.use(require("express-asset-manager")(assets.resources, assets.config));

app.configure('development', function() {
    app.use('/assets', express.static(__dirname + '/assets'))
});

// in production, use a reverse proxy instead
app.configure('production', function() {
    app.use('/assets', express.static(__dirname + '/builtAssets'))
});

app.listen(port)
console.log('Starting Silos Platform ' + port)