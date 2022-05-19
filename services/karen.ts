import {createConnection, type Socket} from 'node:net';

let connection: Socket;

async function initConnection() {
  return new Promise<void>((resolve) => {
    connection = createConnection('events/karen', () => {
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
