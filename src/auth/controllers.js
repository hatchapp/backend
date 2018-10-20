module.exports = function(services){
	async function init(ctx){
		ctx.body = await services.init({});
	}

	return {
		init,
	};
};
