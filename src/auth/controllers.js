const { pick, pipe } = require('ramda');
const { renameKeys } = require('ramda-adjunct');
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

const passwordSchema = Joi.string().min(4).required();
const usernameAndPasswordSchema = Joi.object().keys({
	name: Joi.string().trim().min(1).required(),
	password: passwordSchema,
});
const changeSchema = usernameAndPasswordSchema.append({
	new_password: passwordSchema,
});

const formatAuth = pipe(
	pick(['_id', 'name', 'createdAt', 'updatedAt', 'version', 'register_status', 'meta']),
	renameKeys({ _id: 'id', updatedAt: 'updated_at', createdAt: 'created_at' }),
);

function formatTokenAndAuth({ token, auth }) {
	return { token, auth: formatAuth(auth) };
}

module.exports = function(services, { tokenGenerate, tokenValidate }){
	async function init(ctx){
		const meta = {};

		// if there is auth, refresh, otherwise init anonymous user
		if (ctx.auth) {
			const { id, status, version } = ctx.auth;
			ctx.body = formatTokenAndAuth(await services.refresh(id, status, version, meta))
		} else {
			ctx.body = formatTokenAndAuth(await services.init(meta));
		}
	}

	const register = createControllerWithSchemaValidation(usernameAndPasswordSchema, async function(ctx){
		if(!ctx.auth){
			return ctx.throw(401, 'register requires authorization');
		}
		const { name, password } = ctx.request.body;

		ctx.body = formatTokenAndAuth(await services.register(ctx.auth.id, name, password));
	});

	const login = createControllerWithSchemaValidation(usernameAndPasswordSchema, async function(ctx){
		const { name, password, meta } = ctx.request.body;

		ctx.body = formatTokenAndAuth(await services.login(name, password, meta));
	});

	const refresh = async function(ctx){
		if(!ctx.token)
			throw new Error('no token to refresh');

		const auth = tokenValidate(ctx.token, { ignoreExpiration: true });

		ctx.body = formatTokenAndAuth(await services.refresh(auth.id, auth.status, auth.version));
	};

	const change = createControllerWithSchemaValidation(changeSchema, async function(ctx){
		const { name, password, new_password: newPassword } = ctx.request.body;
		const { id, version } = ctx.auth;

		if(password.trim() === newPassword.trim())
			throw new Error('passwords cannot be the same');

		ctx.body = formatTokenAndAuth(await services.change(id, version, name, password, newPassword));
	});

	return {
		init,
		register,
		login,
		refresh,
		change,
	};
};
