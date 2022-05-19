import * as process from 'node:process';

/* eslint-disable @typescript-eslint/naming-convention */

export const DEVICE_HOSTNAME = process.env.DEVICE_HOSTNAME ?? 'citadel.local';
export const USER_FILE = process.env.USER_FILE ?? '/db/user.json';
export const SIGNAL_DIR = process.env.SIGNAL_DIR ?? '/signals';
export const KAREN_SOCKET = process.env.KAREN_SOCKET ?? '/events/karen';
export const STATUS_DIR = process.env.STATUS_DIR ?? '/statuses';
export const APPS_DIR = process.env.APPS_DIR ?? '/apps';
export const TOR_HIDDEN_SERVICE_DIR =
  process.env.TOR_HIDDEN_SERVICE_DIR ?? '/var/lib/tor';
export const JWT_PUBLIC_KEY_FILE =
  process.env.JWT_PUBLIC_KEY_FILE ?? '/db/jwt-public-key/jwt.pem';
export const JWT_PRIVATE_KEY_FILE =
  process.env.JWT_PRIVATE_KEY_FILE ?? '/db/jwt-private-key/jwt.key';
export const SEED_FILE = process.env.SEED_FILE ?? '/db/citadel-seed/seed';
export const ELECTRUM_PORT =
  Number.parseInt(process.env.ELECTRUM_PORT ?? '50001', 10) ?? 50_001;
export const BITCOIN_P2P_PORT =
  Number.parseInt(process.env.BITCOIN_P2P_PORT ?? '8333', 10) ?? 8333;
export const BITCOIN_RPC_PORT =
  Number.parseInt(process.env.BITCOIN_RPC_PORT ?? '8332', 10) ?? 8332;
export const BITCOIN_RPC_USER = process.env.BITCOIN_RPC_USER ?? 'citadel';
export const BITCOIN_RPC_PASSWORD =
  process.env.BITCOIN_RPC_PASSWORD ?? 'moneyprintergobrrr';
export const LND_CERT_FILE = process.env.LND_CERT_FILE ?? '/lnd/tls.cert';
export const LND_ADMIN_MACAROON_FILE =
  process.env.LND_ADMIN_MACAROON_FILE ??
  '/lnd/data/chain/bitcoin/mainnet/admin.macaroon';
export const GITHUB_REPO = process.env.GITHUB_REPO ?? 'runcitadel/core';
export const GITHUB_BRANCH = process.env.GITHUB_BRANCH ?? 'main';
export const VERSION_FILE = process.env.VERSION_FILE ?? '/info.json';
export const TOR_PROXY_IP = process.env.TOR_PROXY_IP ?? '192.168.0.1';
export const TOR_PROXY_PORT =
  Number.parseInt(process.env.TOR_PROXY_PORT ?? '9050', 10) ?? 9050;
export const REDIS_IP = process.env.REDIS_IP ?? '192.168.0.1';
export const REDIS_PORT =
  Number.parseInt(process.env.REDIS_PORT ?? '6379', 10) ?? 6379;
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD ?? 'freedom';
export const IS_CITADEL_OS = process.env.IS_CITADEL_OS === 'true';
/* eslint-enable @typescript-eslint/naming-convention */
