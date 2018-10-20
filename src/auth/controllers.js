module.exports = function(services){
	async function hello(ctx){
		ctx.body = await services.hello();
	}

	return {
		hello,
	};
};
