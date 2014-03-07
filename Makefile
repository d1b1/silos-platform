heroku:
	export NODE_ENV="development"; \
	// export HEROKU_API_TOKEN="XXXXXXX"; \
	nodemon index.js --ignore builtAssets
