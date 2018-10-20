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

const registerSchema = Joi.object().keys({

});

module.exports = function(services, { tokenGenerate }){
	async function init(ctx){
		ctx.body = await services.init({});
	}

	const register = createControllerWithSchemaValidation(registerSchema, async function(ctx){
		ctx.body = ctx.request.body;
	});

	return {
		init,
		register,
	};
};
