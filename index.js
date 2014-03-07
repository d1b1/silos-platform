var express = require("express")
var request = require("request")
var argv    = require("optimist").argv
var assets  = require("./config/assets")
var async   = require("async")
var _       = require("underscore")
var Heroku  = require("heroku-client")
var heroku  = new Heroku({ token: process.env.HEROKU_API_TOKEN })

var port = argv.port || process.env.PORT || 5000
var app = express()

app.set("views", __dirname + "/views")
app.set("view options", { layout: false, pretty: true })
app.set("view engine", "jade")
app.use(express.bodyParser())
app.use(express.json())
app.use(express.urlencoded())
app.use(express.methodOverride())

app.get("/", function(req, res) {
  res.render("home")
})

app.post("/create", function(req, res) {

  if (req.body.appname == "") 
  	return res.redirect("/")

  var opts = { name: "silo-beta-" + req.body.appname }

  heroku.post("/apps", opts, function (err, app) {
    if (err)
      return res.redirect("/?Error=Unable to create App.")

    async.parallel({
      domain: function(callback) {
        heroku.apps(opts.name).domains().create({ hostname: opts.name + ".roadmaps.io" }, function(err, domain) {
          callback(null, domain)
        })
      },
      mongo: function(callback) {
        heroku.apps(opts.name).addons().create({ plan: "mongohq:sandbox" }, function(err, addon) {
          callback(null, addon)
        })
      },
      slug: function(callback) {
        var slugid = "e5426db9-3d84-424e-a064-6555561fefc1";
        heroku.apps(opts.name).releases().create({ slug: slugid }, function(err, release) {
          callback(null, release)
        })
      }
    }, function(err, results) {

      res.redirect("/app/" + app.name)
    })
  })
})

app.get("/app/:name", function(req, res) {

  var app = heroku.apps(req.params.name)
  app.info(function (err, app) {
  	if (err)
  	  return res.redirect("/app?message=No-App-Found")

    async.parallel({
      addons: function(callback) {
  	    heroku.apps(app.name).addons().list(function(err, addons) {
  	      callback(null, addons)
  	    })
      },
      domains: function(callback) {
        heroku.apps(app.name).domains().list(function(err, domains) {
          callback(null, domains)
        })
      },
      releases: function(callback) {
        heroku.apps(app.name).releases().list(function(err, releases) {
          callback(null, releases)
        })
      }
    }, function(err, results) {
      if (err) {
        console.log('Error in App')
        return res.send('Error in App Get')
      }

      var opts = {
       app:      app, 
       domains:  results.domains, 
       releases: results.releases, 
       addons:   results.addons 
      }

	    res.render("app", opts)
    })  
  })

})

app.get("/apps", function(req, res) {
  heroku.apps().list(function (err, apps) {

  	apps = _.filter(apps, function(app) {
      return app.name.substring(0, 9) == "silo-beta"
  	})

	res.render("apps", { apps: apps })
  })
})

app.use(app.router)
app.use(require("express-asset-manager")(assets.resources, assets.config))

app.configure("development", function() {
    app.use("/assets", express.static(__dirname + "/assets"))
})

// in production, use a reverse proxy instead
app.configure("production", function() {
    app.use("/assets", express.static(__dirname + "/builtAssets"))
})

app.listen(port)
console.log("Starting Silos Platform " + port)