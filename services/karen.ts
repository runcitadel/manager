
import {KAREN_SOCKET} from '../utils/const.ts';

export async function runCommand(command: string) {
  let connection = await Deno.connect({ path: KAREN_SOCKET, transport: "unix" });
  await connection.write(new TextEncoder().encode(command));
  await connection.close();
}
