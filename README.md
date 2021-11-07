# manager

Manager provides a low-level system API that handles:
- User authentication using JWT
- Encryption/decryption of sensitive information, such as the lightning wallet's seed
- CRUD operations
- Lifecycle-management of all other containerized services

## 🛠 Running manager (for development purposes only)

### Step 1. Install dependencies
```sh
yarn
```

### Step 2. Set environment variables
Set the following environment variables directly or by placing them in `.env` file of project's root.

| Variable | Description | Default |
| ------------- | ------------- | ------------- |
| `PORT` | Port where manager should listen for requests | `3006` |
| `DEVICE_HOSTS` | Comma separated list of IPs or domain names to whitelist for CORS | `http://citadel.local` |
| `USER_FILE` | Path to the user's data file (automatically created on user registration) | `/db/user.json` |
| `MIDDLEWARE_API_URL` | IP or domain where [`middleware`](https://github.com/runcitadel/middleware) is listening | `http://localhost` |
| `MIDDLEWARE_API_PORT` | Port where [`middleware`](https://github.com/runcitadel/middleware) is listening | `3005` |
| `JWT_PUBLIC_KEY_FILE` | Path to the JWT public key (automatically created) | `/db/jwt-public-key/jwt.pem` |
| `JWT_PRIVATE_KEY_FILE` | Path to the JWT private key (automatically created) | `/db/jwt-public-key/jwt.key` |
| `JWT_EXPIRATION` | JWT expiration in miliseconds | `3600` |
| `SEED_FILE` | Path to the seed used to deterministically generate entropy | `'/db/citadel-seed/seed'` |
| `DASHBOARD_HIDDEN_SERVICE_FILE` | Path to Tor hostname of [`dashboard`](https://github.com/runcitadel/dashboard) | `/var/lib/tor/dashboard/hostname` |
| `ELECTRUM_HIDDEN_SERVICE_FILE` | Path to Electrum hidden service hostname | `/var/lib/tor/electrum/hostname` |
| `ELECTRUM_PORT` | Port the Electrum server is listening on | `50001` |
| `BITCOIN_P2P_HIDDEN_SERVICE_FILE` | Path to P2P hidden service hostname of `bitcoin` | `/var/lib/tor/bitcoin-p2p/hostname` |
| `BITCOIN_P2P_PORT` | P2P port of `bitcoin` | `8333` |
| `BITCOIN_RPC_HIDDEN_SERVICE_FILE` | Path to RPC hidden service hostname of `bitcoin` | `/var/lib/tor/bitcoin-rpc/hostname` |
| `BITCOIN_RPC_PORT` | RPC port of `bitcoin` | `8332` |
| `BITCOIN_RPC_USER` | RPC user for `bitcoin` | `citadel` |
| `BITCOIN_RPC_PASSWORD` | RPC password for `bitcoin` | `moneyprintergobrrr` |
| `GITHUB_REPO` | GitHub repository of Citadel | `runcitadel/compose-nonfree` |
| `VERSION_FILE` | Path to Citadel's version file | `/info.json` |
| `UPDATE_LOCK_FILE` | Path to the update lock file | `/statuses/update-in-progress` |
| `TOR_PROXY_IP` | IP or domain where Tor proxy is listening | `192.168.0.1` |
| `TOR_PROXY_PORT` | Port where Tor proxy is listening | `9050` |

### Step 3. Run manager
```sh
yarn start
```

You can browse through the available API endpoints [here](https://github.com/runcitadel/manager/tree/master/routes/v1).

---

### ⚡️ Don't be too reckless

> Citadel is still in an early stage and things are expected to break every now and then. We **DO NOT** recommend running it on the mainnet with real money just yet, unless you want to be really *#reckless*.

## ❤️ Contributing

We welcome and appreciate new contributions!

If you're a developer looking to help but not sure where to begin, check out [these issues](https://github.com/runcitadel/manager/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22) that have specifically been marked as being friendly to new contributors.

If you're looking for a bigger challenge, before opening a pull request please [create an issue](https://github.com/runcitadel/manager/issues/new/choose) or [join our Discord server](https://discord.com/invite/d6SaSTh3Dj) to get feedback, discuss the best way to tackle the challenge, and to ensure that there's no duplication of work.

## 🙏 Acknowledgements

Manager is inspired by and built upon the work done by [Umbrel](https://github.com/getumbrel) on its open-source [Node Manager API](https://github.com/getumbrel/umbrel-manager).

The original code we forked is licensed under

```
Copyright (c) 2018-2019 Casa, Inc. https://keys.casa/
Copyright (c) 2020 Umbrel. https://getumbrel.com/
```

---

[![License](https://img.shields.io/github/license/runcitadel/manager?color=%235351FB)](https://github.com/runcitadel/manager/blob/master/LICENSE)

