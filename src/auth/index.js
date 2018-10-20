const Router = require('koa-router');

module.exports = function(config){
	const auth = new Router();
	const services = require('./services')(config);
	const controllers = require('./controllers')(services);

	auth.get('/hello', controllers.hello);

	return { router: auth };
};