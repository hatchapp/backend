const Joi = require('joi');

function createControllerWithSchemaValidation(schema, originalController){
	return async function controller(ctx, next){
		const { error, value } = Joi.validate(ctx.request.body, schema);

		if(error){
			return ctx.throw(400, error);
		}

		ctx.request.body = value;
		return originalController(ctx, next);
	}
}

const usernameAndPasswordSchema = Joi.object().keys({
	name: Joi.string().trim().min(1).required(),
	password: Joi.string().min(4).required(),
});

module.exports = function(services, { tokenGenerate, tokenValidate }){
	async function init(ctx){
		const meta = ctx.auth
			? { parent: ctx.auth.id }
			: {};
		ctx.body = await services.init(meta);
	}

	const register = createControllerWithSchemaValidation(usernameAndPasswordSchema, async function(ctx){
		if(!ctx.auth){
			return ctx.throw(401, 'register requires authorization');
		}
		const { name, password } = ctx.request.body;

		ctx.body = await services.register(ctx.auth.id, name, password);
	});

	const login = createControllerWithSchemaValidation(usernameAndPasswordSchema, async function(ctx){
		const { name, password } = ctx.request.body;

		ctx.body = await services.login(name, password);
	});

	const refresh = async function(ctx){
		if(!ctx.token)
			throw new Error('no token to refresh');

		const auth = tokenValidate(ctx.token, { ignoreExpiration: true });

		ctx.body = await services.refresh(auth.id, auth.status, auth.version);
	};

	return {
		init,
		register,
		login,
		refresh,
	};
};
