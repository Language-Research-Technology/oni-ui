const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const path = require('path');
const log = getLogger();

function getLogger(logPath) {
  const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level.toUpperCase()}: ${message}`;
  });
  let combinedLogPath = path.join(process.cwd(), 'oni-ui.combined.log');
  let errorLogPath = path.join(process.cwd(), 'error.log');
  if(logPath) {
    combinedLogPath = path.join(logPath, 'oni-ui.combined.log');
    errorLogPath = path.join(logPath, 'oni-ui.error.log');
  }
  const logLevel = process.env.LOG_LEVEL;
  const logger = createLogger({
    level: logLevel || 'info',
    format: combine(timestamp(), myFormat),
    transports: [
      new transports.Console(),
      // Write all logs with level `info` and below to `combined.log`
      new transports.File({ filename: combinedLogPath }),
      // Write all logs with level `error` and below to `error.log`
      new transports.File({ filename: errorLogPath, level: 'error' })
    ],
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
