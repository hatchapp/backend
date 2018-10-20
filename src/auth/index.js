const Router = require('koa-router');
const { sign } = require('jsonwebtoken');
const { DEFAULT_TOKEN_EXPIRE } = require('./constants');

function createTokenFunctions(
	{
		expiresIn = DEFAULT_TOKEN_EXPIRE,
		secret,
	}
){
	function tokenGenerate({ version, name, register_status: status, _id, createdAt }){
		const payload = {
			id: _id.toString(),
			version, name, status, createdAt
		};

		return sign(payload, secret, { expiresIn });
	}

	return { tokenGenerate };
}

module.exports = function(config, database){
	const auth = new Router();
	const jwtFunctions = createTokenFunctions(config);
	const services = require('./services')(config, database, jwtFunctions);
	const controllers = require('./controllers')(services, jwtFunctions);

	auth.get('/init', controllers.init);
	auth.post('/register', controllers.register);

	return { router: auth };
};