import { transports, createLogger, format } from 'winston';
const { combine, colorize, simple } = format;

/**
 * Winston logging tool
 */
const logger = createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    transports: [
        new transports.Console({
            handleExceptions: true,
            format: combine(colorize(), simple())
        })
    ]
});

export default logger;
