const configPath = process.env.CONFIG_PATH || 'configuration.json';
module.exports = require(configPath);
