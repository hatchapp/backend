const Router = require('koa-router');
const { sign, verify } = require('jsonwebtoken');
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

	function tokenValidate(tokenString){
		return verify(tokenString, secret);
	}

	return { tokenGenerate, tokenValidate };
}

module.exports = function(config, database){
	const auth = new Router();
	const jwtFunctions = createTokenFunctions(config);
	const services = require('./services')(config, database, jwtFunctions);
	const controllers = require('./controllers')(services, jwtFunctions);

	// jwt token parsing middleware
	auth.use(async function tokenController(ctx, next){
		const { authorization } = ctx.request.header;
		if(!authorization) return next();

		try {
			const [ headerKey, tokenString ] = authorization.trim().split(' ');
			if(headerKey !== 'Bearer') return ctx.throw(400, 'invalid authorization header key');

			try{
				ctx.auth = jwtFunctions.tokenValidate(tokenString);
				return next();
			}catch(err){
				return ctx.throw(401, err);
			}
		}catch(err){
			return ctx.throw(500, err);
		}
	});

	auth.get('/init', controllers.init);
	auth.post('/register', controllers.register);

	return { router: auth };
};