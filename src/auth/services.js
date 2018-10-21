const { genSaltSync, hashSync, compareSync } = require('bcrypt');
const { ObjectId } = require('mongodb');
const sillyName = require('sillyname');
const { DEFAULT_HASH_ROUND, REGISTER_STATUS } = require('./constants');

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

function createPasswordFunctions({ round = DEFAULT_HASH_ROUND } = {}){
	function hash(plainText){
		const salt = genSaltSync(round);
		return hashSync(plainText, salt);
	}

	function compare(plainText, hash){
		return compareSync(plainText, hash);
	}

	return { hash, compare };
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
	const { hash, compare } = createPasswordFunctions();

	async function init(meta){
		const doc = createEmptyAuthWithMeta(meta);

		await tokenCol.insertOne(doc);

		return { token: tokenGenerate(doc) };
	}

	async function register(id, name, password){
		const oid = ObjectId(id);
		const isUnique = (await tokenCol.countDocuments({ name })) === 0;

		if(!isUnique)
			throw new Error('this name is already in use');

		const { value: doc } = await tokenCol.findOneAndUpdate(
			{ _id: oid, register_status: REGISTER_STATUS.UNREGISTERED },
			{
				$set: {
					name,
					password: hash(password),
					register_status: REGISTER_STATUS.REGISTERED,
					version: Date.now(),
				},
			},
			{ returnOriginal: false }
		);

		if(!doc)
			throw new Error('could not find an unregistered token document');

		return { token: tokenGenerate(doc) };
	}

	async function login(name, password){
		const doc = await tokenCol.findOne({ name });

		if(!doc)
			throw new Error('this name is not registered');

		if(!compare(password, doc.password))
			throw new Error('wrong password for the name');

		return { token: tokenGenerate(doc) };
	}

	async function refresh(id, status, version){
		const doc = await tokenCol.findOne({
			_id: ObjectId(id),
			register_status: status,
			version,
		});

		if(!doc)
			throw new Error('this token cannot be refreshed, please login');

		return { token: tokenGenerate(doc) };
	}

	return {
		init,
		register,
		login,
		refresh,
	};
};
