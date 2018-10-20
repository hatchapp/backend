module.exports = {
	name: 'emoji-app-backend',
	logger: {

	},
	database: {
		connectionString: process.env.AUTH_DATABASE_CONNECTION_STRING || 'mongodb://localhost:27017/emoji-app',
	},
	auth: {
		collection: 'tokens',
		secret: process.env.JWT_SECRET || 'top-secret',
	},
	port: process.env.LISTEN_PORT || 8080,
};