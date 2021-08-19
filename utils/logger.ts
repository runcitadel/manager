import winston from "winston";
const { Container } = winston;
import { format } from "logform";
import DailyRotateFile from "winston-daily-rotate-file";
import * as fs from "fs";
import * as path from "path";
import constants from "./const.js";
import { getNamespace } from "continuation-local-storage";

const LOCAL = "local";
const logDir = "./logs";
const ENV = process.env.NODE_ENV;

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const appendCorrelationId = format((info, _options) => {
  const apiRequest = getNamespace(constants.REQUEST_CORRELATION_NAMESPACE_KEY);
  if (apiRequest) {
    info.internalCorrelationId = apiRequest.get(
      constants.REQUEST_CORRELATION_ID_KEY
    );
  }

  return info;
});

const errorFileTransport = new DailyRotateFile({
  filename: path.join(logDir, "error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  level: "error",
  maxSize: "10m",
  maxFiles: "7d",
});

const apiFileTransport = new DailyRotateFile({
  filename: path.join(logDir, "api-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  maxSize: "10m",
  maxFiles: "7d",
});

const localLogFormat = format.printf((info) => {
  let data = "";
  if (info.data) {
    data = JSON.stringify({ data: info.data });
  }

  return `${info.timestamp} ${info.level.toUpperCase()}: ${
    info.internalCorrelationId
  } [${info._module}] ${info.message} ${data}`;
});

const localLoggerTransports: winston.transport[] = [
  errorFileTransport,
  apiFileTransport,
];

if (ENV === "development") {
  localLoggerTransports.push(new winston.transports.Console());
}

const container = new Container();

container.add(LOCAL, {
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    appendCorrelationId(),
    localLogFormat
  ),
  transports: localLoggerTransports,
});

export const morganConfiguration = {
  stream: {
    write(message: string): void {
      info(message, "manager", "");
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
