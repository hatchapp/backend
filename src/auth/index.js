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

	function tokenValidate(tokenString, options = {}){
		return verify(tokenString, secret, options);
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

			ctx.token = tokenString;
			return next();
		}catch(err){
			return ctx.throw(500, err);
		}
	});

	// jwt token validating
	auth.use(['/init', '/register', '/change'], async function authController(ctx, next){
		if(!ctx.token) return next();

		try{
			ctx.auth = jwtFunctions.tokenValidate(ctx.token);
			return next();
		}catch(err){
			return ctx.throw(401, err);
		}
	});

	auth.get('/init', controllers.init);
	auth.post('/register', controllers.register);
	auth.post('/login', controllers.login);
	auth.get('/refresh', controllers.refresh);
	auth.patch('/change', controllers.change);

	return { router: auth };
};
