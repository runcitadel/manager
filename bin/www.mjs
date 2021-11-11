#!/usr/bin/env -S node

/**
 * Module dependencies.
 */

import * as http from 'node:http';
import * as process from 'node:process';
import debugPkg from 'debug';
import app from '../app.js';

const debug = debugPkg('citadel-manager:server');

/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || '3005');

/**
 * Create HTTP server.
 */

const server = http.createServer(app.callback());

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(value) {
  const port = Number.parseInt(value, 10);

  // eslint-disable-next-line unicorn/prefer-number-properties
  if (isNaN(port)) {
    // Named pipe
    return value;
  }

  if (port >= 0) {
    // Port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
  console.log('Listening on ' + bind);
}
