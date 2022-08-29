export const DEVICE_HOSTNAME = Deno.env.get("DEVICE_HOSTNAME") || 'citadel.local';
export const USER_FILE = Deno.env.get("USER_FILE") || '/db/user.json';
export const KAREN_SOCKET = Deno.env.get("KAREN_SOCKET") || '/events/karen';
export const STATUS_DIR = Deno.env.get("STATUS_DIR") || '/statuses';
export const APPS_DIR = Deno.env.get("APPS_DIR") || '/apps';
export const TOR_HIDDEN_SERVICE_DIR =
  Deno.env.get("TOR_HIDDEN_SERVICE_DIR") || '/var/lib/tor';
export const JWT_PUBLIC_KEY_FILE =
  Deno.env.get("JWT_PUBLIC_KEY_FILE") || '/db/jwt-public-key/jwt.pem';
export const JWT_PRIVATE_KEY_FILE =
  Deno.env.get("JWT_PRIVATE_KEY_FILE") || '/db/jwt-private-key/jwt.key';
export const SEED_FILE = Deno.env.get("SEED_FILE") || '/db/citadel-seed/seed';
export const ELECTRUM_PORT =
  Number.parseInt(Deno.env.get("ELECTRUM_PORT") || '50001', 10) || 50_001;
export const BITCOIN_P2P_PORT =
  Number.parseInt(Deno.env.get("BITCOIN_P2P_PORT") || '8333', 10) || 8333;
export const BITCOIN_RPC_PORT =
  Number.parseInt(Deno.env.get("BITCOIN_RPC_PORT") || '8332', 10) || 8332;
export const BITCOIN_RPC_USER = Deno.env.get("BITCOIN_RPC_USER") || 'citadel';
export const BITCOIN_RPC_PASSWORD =
  Deno.env.get("BITCOIN_RPC_PASSWORD") || 'moneyprintergobrrr';
export const LND_CERT_FILE = Deno.env.get("LND_CERT_FILE") || '/lnd/tls.cert';
export const LND_ADMIN_MACAROON_FILE =
  Deno.env.get("LND_ADMIN_MACAROON_FILE") ||
  '/lnd/data/chain/bitcoin/mainnet/admin.macaroon';
export const GITHUB_REPO = Deno.env.get("GITHUB_REPO") || 'runcitadel/core';
export const GITHUB_BRANCH = Deno.env.get("GITHUB_BRANCH") || 'main';
export const VERSION_FILE = Deno.env.get("VERSION_FILE") || '/info.json';
export const TOR_PROXY_IP = Deno.env.get("TOR_PROXY_IP") || '192.168.0.1';
export const TOR_PROXY_PORT =
  Number.parseInt(Deno.env.get("TOR_PROXY_PORT") || '9050', 10) || 9050;
export const REDIS_IP = Deno.env.get("REDIS_IP") || '192.168.0.1';
export const REDIS_PORT =
  Number.parseInt(Deno.env.get("REDIS_PORT") || '6379', 10) || 6379;
export const REDIS_PASSWORD = Deno.env.get("REDIS_PASSWORD") || 'freedom';
export const IS_CITADEL_OS = Deno.env.get("IS_CITADEL_OS") === 'true';
/* eslint-enable @typescript-eslint/naming-convention */
