import {createConnection, type Socket} from 'node:net';
import {KAREN_SOCKET} from '../utils/const.js';

let connection: Socket;

async function initConnection() {
  return new Promise<void>((resolve) => {
    connection = createConnection(KAREN_SOCKET, () => {
      resolve();
    });
  });
}

export async function runCommand(command: string) {
  await initConnection();
  return new Promise<void>((resolve, reject) => {
    const errorListener = (error: unknown) => {
      reject(error);
    };

    connection.on('error', errorListener);

    connection.write(command, () => {
      connection.off('error', errorListener);
      resolve();
    });
  });
}
