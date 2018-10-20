const Koa = require('koa');
const BodyParser = require('koa-bodyparser');
const Bunyan = require('bunyan');
const Router = require('koa-router');
const { MongoClient } = require('mongodb');
const app = new Koa();
const config = require('./config.js');
const logger = Bunyan.createLogger(Object.assign({}, config.logger, { name: config.name }));

/**
 *
 * @param connectionString
 * @param database
 * @returns {Promise<Db>}
 */
async function createAuthDatabase({ connectionString }){
	const client = await MongoClient.connect(connectionString, { useNewUrlParser: true });
	return client.db();
}

// parse the request json bodies
app.use(BodyParser());

async function main(){
	const authDatabase = await createAuthDatabase(config.database);
	// get the auth services
	const { router: authRouter } = require('./auth/index')(config.auth, authDatabase);

	// register sub services into the main router
	const service = new Router();
	service.use('/auth', authRouter.routes(), authRouter.allowedMethods());

	await app
		.use(service.routes())
		.use(service.allowedMethods())
		.listen(config.port);

	logger.info({ service: { port: config.port } }, 'backend service started successfully');
}

main()
	.catch((err) => {
		logger.error(err, 'an error happened when starting the backend service');
		process.exit(-1);
	});
