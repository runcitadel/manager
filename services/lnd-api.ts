import * as process from 'node:process';
import fetch from 'node-fetch';

// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const lnapiUrl = process.env.MIDDLEWARE_API_URL || 'http://localhost';
// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
const lnapiPort = process.env.MIDDLEWARE_API_PORT || 3005;

export async function initializeWallet(
  seed: string[],
  jwt: string,
): Promise<unknown> {
  const headers = {
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

export async function getStatus(): Promise<unknown> {
  return (await fetch(`${lnapiUrl}:${lnapiPort}/v1/lnd/info/status`)).json();
}
