const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;

const log = getLogger();

function getLogger() {
  const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level.toUpperCase()}: ${message}`;
  });
  const logLevel = process.env.LOG_LEVEL;
  const logger = createLogger({
    level: logLevel || 'info',
    format: combine(timestamp(), myFormat),
    transports: [new transports.Console()],
  });
  return logger;
}

async function logEvent({ level, owner, text, data }) {
  const levels = ['info', 'warn', 'error'];
  if (!level || !levels.includes(level)) {
    throw new Error(`'level' is required and must be one of '${levels}'`);
  }
  if (!text) {
    throw new Error(`'text' is required`);
  }
  try {
    await models.log.create({ level, owner, text, data });
  } catch (error) {
    log.error(`Couldn't update logs table: ${level}: ${text}`);
  }
}

module.exports = {
  getLogger,
  logEvent,
};
