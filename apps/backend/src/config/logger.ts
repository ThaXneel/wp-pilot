
import winston from 'winston';
import { env } from './env.js';
import fs from 'fs';
import path from 'path';

const { combine, timestamp, printf, colorize, json } = winston.format;

const devFormat = combine(
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}] ${message}${metaStr}`;
  })
);


const prodFormat = combine(timestamp(), json());

// Ensure logs directory exists, or fallback to console only
let fileTransports: winston.transport[] = [];
if (env.NODE_ENV === 'production') {
  const logsDir = path.resolve('logs');
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    fileTransports = [
      new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
      new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
    ];
  } catch (e) {
    // Fallback: log to console only if cannot write to logs dir
    fileTransports = [];
  }
}

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [
    new winston.transports.Console(),
    ...fileTransports,
  ],
});
