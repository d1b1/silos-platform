exports.resources = {

    "style.css" : {
        type: "css",
        dir: "css",
        files: [
            "bootstrap.css",
            "bootstrap-responsive.css",
            "custom.css"
        ]
    },
    "javascript.js" : {
        type: "js",
        dir: "js",
        files: [
            "jquery.js",
            "jquery.cookie.js",
            "bootstrap-typeahead.js",
            "bootstrap-dropdown.js",
            "bootstrap-collapse.js",
            "bootstrap-tab.js",
            "bootstrap-affix.js",
            "bootstrap-modal.js",
            "bootstrap-carousel.js",
            "bootstrap-tooltip.js",
            "underscore.js"
        ]
    }

}

exports.config = {
	env         : "production",
    rootRoute   : "/static",
    srcDir      : "./assets",
    buildDir    : "./builtAssets",
    process     : "false"
};
