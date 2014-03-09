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

  var opts = { 
    name: "silo-beta-" + req.body.appname.split(" ").join("-").toLowerCase() 
  }

  checkAppNameIsFree(opts.name, function(err, appInfo) {
    if (err) {
      return res.send('Error creating the new APP.')
    }

    if (appInfo)
      return res.send('App Name already used.')

    heroku.post("/apps", opts, function (err, app) {
      if (err)
        return res.redirect("/?Error=Unable to create App.")

      async.parallel({
        domain: function(callback) {
          heroku.apps(opts.name).domains().create({ hostname: opts.name + ".roadmaps.io" }, function(err, domain) {
            callback(err, domain)
          })
        },
        mongo: function(callback) {
          heroku.apps(opts.name).addons().create({ plan: "mongohq:sandbox" }, function(err, mongo) {
            callback(err, mongo)
          })
        },
        redis: function(callback) {
          heroku.apps(opts.name).addons().create({ plan: "rediscloud:25" }, function(err, redis) {
            callback(err, redis)
          })
        },
        slug: function(callback) {

          // Name of the active template
          var tmplAppName = "tosheroon";

          // Get the most recent slug for the template app.
          getSlugInfo(tmplAppName, function(err, slugObj) {
            heroku.apps(opts.name).releases().create({ slug: slugObj.slug.id }, function(err, release) {
              callback(null, release)
            })
          })

        }
      }, function(err, results) {

        res.redirect("/app/" + app.name)
      })
    })
  })
})

function checkAppNameIsFree(appName, cb) {

  var app = heroku.apps(appName)
  app.info(function (err, app) {
    if (err) {
      if (err.statusCode == 404) {
        return cb(null, null)
      }
    }

    if (err)
      return cb(err)

    if (!app) 
      return cb(null, null)

    cb(null, app)
  })

}

/*
 * Gets the slug in of the most recent from the template
 * app. There can be more then one app which the user can
 * select.
 *
 */

function getSlugInfo(tmplAppName, cb) {
  heroku.apps(tmplAppName).releases().list(function(err, releases) {
    releases = _.filter(releases, function(slug) { return slug.slug != null; })
    releases = _.sortBy(releases, function(o) { return -o.version; })

    cb(null, _.first(releases))
  })
}

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