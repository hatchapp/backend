const Router = require('koa-router');

module.exports = function(config, database){
	const auth = new Router();
	const services = require('./services')(config, database);
	const controllers = require('./controllers')(services);

	auth.get('/init', controllers.init);

	return { router: auth };
};