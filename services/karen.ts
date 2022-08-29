
import {KAREN_SOCKET} from '../utils/const.ts';

let connection: Deno.UnixConn;

export async function runCommand(command: string) {
  if(!connection)
    connection = await Deno.connect({ path: KAREN_SOCKET, transport: "unix" });
  await connection.write(new TextEncoder().encode(command));
}
