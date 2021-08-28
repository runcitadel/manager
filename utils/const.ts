import * as process from 'node:process';
/* eslint-disable eslint-comments/disable-enable-pair */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */

const consts = {
  DEVICE_HOSTNAME: process.env.DEVICE_HOSTNAME || 'citadel.local',
  USER_FILE: process.env.USER_FILE || '/db/user.json',
  SIGNAL_DIR: process.env.SIGNAL_DIR || '/signals',
  STATUS_DIR: process.env.STATUS_DIR || '/statuses',
  APPS_DIR: process.env.APPS_DIR || '/apps',
  TOR_HIDDEN_SERVICE_DIR: process.env.TOR_HIDDEN_SERVICE_DIR || '/var/lib/tor',
  JWT_PUBLIC_KEY_FILE:
    process.env.JWT_PUBLIC_KEY_FILE || '/db/jwt-public-key/jwt.pem',
  JWT_PRIVATE_KEY_FILE:
    process.env.JWT_PRIVATE_KEY_FILE || '/db/jwt-private-key/jwt.key',
  SEED_FILE:
    process.env.UMBREL_SEED_FILE ||
    process.env.SEED_FILE ||
    '/db/umbrel-seed/seed',
  DASHBOARD_HIDDEN_SERVICE_FILE:
    process.env.UMBREL_DASHBOARD_HIDDEN_SERVICE_FILE ||
    process.env.DASHBOARD_HIDDEN_SERVICE_FILE ||
    '/var/lib/tor/web/hostname',
  ELECTRUM_HIDDEN_SERVICE_FILE:
    process.env.ELECTRUM_HIDDEN_SERVICE_FILE ||
    '/var/lib/tor/electrum/hostname',
  ELECTRUM_PORT:
    Number.parseInt(process.env.ELECTRUM_PORT || '50001', 10) || 50_001,
  BITCOIN_P2P_HIDDEN_SERVICE_FILE:
    process.env.BITCOIN_P2P_HIDDEN_SERVICE_FILE ||
    '/var/lib/tor/bitcoin-p2p/hostname',
  BITCOIN_P2P_PORT:
    Number.parseInt(process.env.BITCOIN_P2P_PORT || '8333', 10) || 8333,
  BITCOIN_RPC_HIDDEN_SERVICE_FILE:
    process.env.BITCOIN_RPC_HIDDEN_SERVICE_FILE ||
    '/var/lib/tor/bitcoin-rpc/hostname',
  BITCOIN_RPC_PORT:
    Number.parseInt(process.env.BITCOIN_RPC_PORT || '8332', 10) || 8332,
  BITCOIN_RPC_USER: process.env.BITCOIN_RPC_USER || 'citadel',
  BITCOIN_RPC_PASSWORD:
    process.env.BITCOIN_RPC_PASSWORD || 'moneyprintergobrrr',
  LND_REST_HIDDEN_SERVICE_FILE:
    process.env.LND_REST_HIDDEN_SERVICE_FILE ||
    '/var/lib/tor/lnd-rest/hostname',
  LND_GRPC_HIDDEN_SERVICE_FILE:
    process.env.LND_GRPC_HIDDEN_SERVICE_FILE ||
    '/var/lib/tor/lnd-grpc/hostname',
  LND_CERT_FILE: process.env.LND_CERT_FILE || '/lnd/tls.cert',
  LND_ADMIN_MACAROON_FILE:
    process.env.LND_ADMIN_MACAROON_FILE ||
    '/lnd/data/chain/bitcoin/mainnet/admin.macaroon',
  LND_WALLET_PASSWORD: process.env.LND_WALLET_PASSWORD || 'moneyprintergobrrr',
  GITHUB_REPO: process.env.GITHUB_REPO || 'runcitadel/compose',
  GITHUB_BRANCH: process.env.GITHUB_BRANCH || 'master',
  VERSION_FILE:
    process.env.UMBREL_VERSION_FILE || process.env.VERSION_FILE || '/info.json',
  TOR_PROXY_IP: process.env.TOR_PROXY_IP || '192.168.0.1',
  TOR_PROXY_PORT:
    Number.parseInt(process.env.TOR_PROXY_PORT || '9050', 10) || 9050,
  STATUS_CODES: {
    ACCEPTED: 202,
    BAD_GATEWAY: 502,
    CONFLICT: 409,
    FORBIDDEN: 403,
    OK: 200,
    UNAUTHORIZED: 401,
  },
  IS_UMBREL_OS: process.env.IS_UMBREL_OS === 'true',
};

export default consts;
