import constants from "../utils/const.ts";

export async function runCommand(command: string) {
  const connection = await Deno.connect({
    path: constants.KAREN_SOCKET,
    transport: "unix",
  });
  await connection.write(new TextEncoder().encode(command));
  await connection.close();
}
