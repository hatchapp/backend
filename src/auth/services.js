const sillyName = require('sillyname');
const { REGISTER_STATUS } = require('./constants');

function createEmptyAuthWithMeta(meta){
	return {
		createdAt: Date.now(),
		updatedAt: Date.now(),
		version: Date.now(),
		name: sillyName(),
		register_status: REGISTER_STATUS.UNREGISTERED,
		meta,
	};
}

/**
 * Services that may be used by the backend auth controllers
 * @param config
 * @param database {Db}
 * @param tokenGenerate
 * @returns {{hello: (function(): string)}}
 */
module.exports = function(config, database, { tokenGenerate }){
	const tokenCol = database.collection(config.collection);

	async function init(meta){
		const doc = createEmptyAuthWithMeta(meta);

		await tokenCol.insertOne(doc);

		return { token: tokenGenerate(doc) };
	}

	return {
		init,
	};
};
