module.exports = {
	version: '0.9.1',
	port: 4000,
	startupMessage: 'Server: ready',
	defaultZone: 'fjolarok',

	//Options: 
	// sqlite
	// rethink
	//eslint-disable-next-line no-process-env
	db: process.env.IWD_DB || 'sqlite',
	//eslint-disable-next-line no-process-env
	dbHost: process.env.IWD_DB_HOST || 'localhost',
	//eslint-disable-next-line no-process-env
	dbPort: process.env.IWD_DB_PORT || 28015,
	//eslint-disable-next-line no-process-env
	dbName: process.env.IWD_DB_NAME || 'live',
	//eslint-disable-next-line no-process-env
	dbUser: process.env.IWD_DB_USER || 'admin',
	//eslint-disable-next-line no-process-env
	dbPass: process.env.IWD_DB_PASS || ''
};
