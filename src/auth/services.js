const { sign } = require('jsonwebtoken');
const sillyName = require('sillyname');
const { DEFAULT_TOKEN_EXPIRE, REGISTER_STATUS } = require('./constants');

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
 * @returns {{hello: (function(): string)}}
 */
module.exports = function(config, database){
	const tokenCol = database.collection(config.collection);
	const { tokenGenerate } = createTokenFunctions(config);

	async function init(meta){
		const doc = createEmptyAuthWithMeta(meta);

		await tokenCol.insertOne(doc);

		return tokenGenerate(doc);
	}

	return {
		init,
	};
};
