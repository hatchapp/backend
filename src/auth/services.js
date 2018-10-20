module.exports = function(config){
	async function hello(){
		return "hello world";
	}

	return {
		hello,
	};
};
