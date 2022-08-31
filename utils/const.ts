export default {
  get DEVICE_HOSTNAME() {
    return Deno.env.get("DEVICE_HOSTNAME") || "citadel.local";
  },
  get USER_FILE() {
    return Deno.env.get("USER_FILE") || "/db/user.json";
  },
  get KAREN_SOCKET() {
    return Deno.env.get("KAREN_SOCKET") || "/events/karen";
  },
  get STATUS_DIR() {
    return Deno.env.get("STATUS_DIR") || "/statuses";
  },
  get APPS_DIR() {
    return Deno.env.get("APPS_DIR") || "/apps";
  },
  get TOR_HIDDEN_SERVICE_DIR() {
    return Deno.env.get("TOR_HIDDEN_SERVICE_DIR") || "/var/lib/tor";
  },
  get JWT_PUBLIC_KEY_FILE() {
    return Deno.env.get("JWT_PUBLIC_KEY_FILE") || "/db/jwt-public-key/jwt.pem";
  },
  get JWT_PRIVATE_KEY_FILE() {
    return Deno.env.get("JWT_PRIVATE_KEY_FILE") ||
      "/db/jwt-private-key/jwt.key";
  },
  get SEED_FILE() {
    return Deno.env.get("SEED_FILE") || "/db/citadel-seed/seed";
  },
  get ELECTRUM_PORT() {
    return Number.parseInt(Deno.env.get("ELECTRUM_PORT") || "50001", 10) ||
      50_001;
  },
  get BITCOIN_P2P_PORT() {
    return Number.parseInt(Deno.env.get("BITCOIN_P2P_PORT") || "8333", 10) ||
      8333;
  },
  get BITCOIN_RPC_PORT() {
    return Number.parseInt(Deno.env.get("BITCOIN_RPC_PORT") || "8332", 10) ||
      8332;
  },
  get BITCOIN_RPC_USER() {
    return Deno.env.get("BITCOIN_RPC_USER") || "citadel";
  },
  get BITCOIN_RPC_PASSWORD() {
    return Deno.env.get("BITCOIN_RPC_PASSWORD") || "moneyprintergobrrr";
  },
  get LND_CERT_FILE() {
    return Deno.env.get("LND_CERT_FILE") || "/lnd/tls.cert";
  },
  get LND_ADMIN_MACAROON_FILE() {
    return Deno.env.get("LND_ADMIN_MACAROON_FILE") ||
      "/lnd/data/chain/bitcoin/mainnet/admin.macaroon";
  },
  get GITHUB_REPO() {
    return Deno.env.get("GITHUB_REPO") || "runcitadel/core";
  },
  get GITHUB_BRANCH() {
    return Deno.env.get("GITHUB_BRANCH") || "main";
  },
  get VERSION_FILE() {
    return Deno.env.get("VERSION_FILE") || "/info.json";
  },
  get TOR_PROXY_IP() {
    return Deno.env.get("TOR_PROXY_IP") || "192.168.0.1";
  },
  get TOR_PROXY_PORT() {
    return Number.parseInt(Deno.env.get("TOR_PROXY_PORT") || "9050", 10) ||
      9050;
  },
  get IS_CITADEL_OS() {
    return Deno.env.get("IS_CITADEL_OS") === "true";
  },
};
