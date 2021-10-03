import * as process from 'node:process';
import fetch from 'node-fetch';

const lnapiUrl = process.env.MIDDLEWARE_API_URL ?? 'http://localhost';
const lnapiPort = process.env.MIDDLEWARE_API_PORT ?? 3005;

export async function initializeWallet(
  seed: string[],
  jwt: string,
): Promise<unknown> {
  const headers = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    Authorization: 'JWT ' + jwt,
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({
    seed,
  });

  const data = await fetch(`${lnapiUrl}:${lnapiPort}/v1/lnd/wallet/init`, {
    body,
    headers,
    method: 'POST',
  });

  return data;
}
