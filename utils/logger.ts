import winston from 'winston';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

// Create logger without chalk initially
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.LOG_LEVEL || 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf((info) => {
          const { level, message, timestamp, test } = info;
          const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
          const testStr = test as string | undefined;
          
          // Simple coloring without chalk
          let colorizedLevel = level;
          switch (level) {
            case 'error':
              colorizedLevel = `\x1b[31m${level}\x1b[0m`; // red
              break;
            case 'warn':
              colorizedLevel = `\x1b[33m${level}\x1b[0m`; // yellow
              break;
            case 'info':
              colorizedLevel = `\x1b[34m${level}\x1b[0m`; // blue
              break;
            case 'debug':
              colorizedLevel = `\x1b[32m${level}\x1b[0m`; // green
              break;
          }
          return `\x1b[90m${timestamp}\x1b[0m [${colorizedLevel}] ${testStr ? `[${testStr}]` : ''} ${messageStr}`;
        })
      ),
    }),
    new winston.transports.File({
      filename: 'logs/test-execution.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
    }),
  ],
});

export { logger };

// Playwright-friendly interface
export const testLogger = {
  info: (message: string, testName?: string) => 
    logger.info(message, { test: testName }),
  
  error: (message: string, testName?: string) => 
    logger.error(message, { test: testName }),
  
  warn: (message: string, testName?: string) => 
    logger.warn(message, { test: testName }),
  
  debug: (message: string, testName?: string) => 
    logger.debug(message, { test: testName }),
};
