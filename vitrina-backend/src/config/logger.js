// ============================================================
//  config/logger.js
//  Logger centralizado con Winston
//  Guarda logs en archivos y muestra en consola en desarrollo
// ============================================================

const winston = require('winston');
const path    = require('path');

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Errores a archivo separado
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level   : 'error',
    }),
    // Todos los logs
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
    }),
  ],
});

// En desarrollo también mostrar en consola con colores
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), logFormat),
  }));
}

module.exports = logger;
