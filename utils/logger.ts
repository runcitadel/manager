import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';
import winston from 'winston';
import {format} from 'logform';
import DailyRotateFile from 'winston-daily-rotate-file';

const {Container} = winston;

const LOCAL = 'local';
const logDir = './logs';
const ENV = process.env.NODE_ENV;

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const errorFileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  maxSize: '10m',
  maxFiles: '7d',
});

const apiFileTransport = new DailyRotateFile({
  filename: path.join(logDir, 'api-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '10m',
  maxFiles: '7d',
});

const localLogFormat = format.printf((info) => {
  let data = '';
  if (info.data) {
    data = JSON.stringify({data: info.data as unknown});
  }

  return `${info.timestamp as string} ${info.level.toUpperCase()}: [${
    info._module as string
  }] ${info.message} ${data}`;
});

const localLoggerTransports: winston.transport[] = [
  errorFileTransport,
  apiFileTransport,
];

if (ENV === 'development') {
  localLoggerTransports.push(new winston.transports.Console());
}

const container = new Container();

container.add(LOCAL, {
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), localLogFormat),
  transports: localLoggerTransports,
});

export const morganConfiguration = {
  stream: {
    write(message: string): void {
      info(message, 'manager', '');
    },
  },
};

const localLogger = container.get(LOCAL);

export function printToStandardOut(data: unknown): void {
  if (data) {
    console.log(data);
  }
}

export function error(message: string, _module: string, data: unknown): void {
  printToStandardOut(message);
  printToStandardOut(_module);
  printToStandardOut(data);
  localLogger.error(message, {
    _module,
    data,
  });
}

export function warn(message: string, _module: string, data: unknown): void {
  printToStandardOut(message);
  printToStandardOut(_module);
  printToStandardOut(data);
  localLogger.warn(message, {
    _module,
    data,
  });
}

export function info(message: string, _module: string, data: unknown): void {
  printToStandardOut(message);
  printToStandardOut(_module);
  printToStandardOut(data);
  localLogger.info(message, {
    _module,
    data,
  });
}

export function debug(message: string, _module: string, data: unknown): void {
  printToStandardOut(message);
  printToStandardOut(_module);
  printToStandardOut(data);
  localLogger.debug(message, {
    _module,
    data,
  });
}
