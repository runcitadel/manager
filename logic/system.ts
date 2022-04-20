import nodeFetch from 'node-fetch';
import semver from 'semver';
import {encode, UrlVersion} from '@runcitadel/lndconnect';
import socksProxyAgentPkg from 'socks-proxy-agent';

import type {
  versionFile,
  updateStatus,
  debugStatus,
  backupStatus,
} from '@runcitadel/utils';
import * as constants from '../utils/const.js';
import * as diskLogic from './disk.js';

// eslint-disable-next-line @typescript-eslint/naming-convention
const {SocksProxyAgent} = socksProxyAgentPkg;

const agent = new SocksProxyAgent(
  `socks5h://${constants.TOR_PROXY_IP}:${constants.TOR_PROXY_PORT}`,
);

export type ConnectionDetails = {
  address: string;
  port: number;
  connectionString: string;
};

export type RpcConnectionDetails = ConnectionDetails & {
  rpcuser: string;
  rpcpassword: string;
};

export type LndConnectionDetails = {
  restTor: string;
  restLocal: string;
  grpcTor: string;
  grpcLocal: string;
};

export type SystemStatus = {
  highMemoryUsage: boolean;
};

export async function getInfo(): Promise<versionFile> {
  try {
    const info = await diskLogic.readVersionFile();
    return info;
  } catch {
    throw new Error('Unable to get system information');
  }
}

export async function getHiddenServiceUrl(): Promise<string> {
  try {
    const url = await diskLogic.readHiddenService('web');
    return url;
  } catch {
    throw new Error('Unable to get hidden service url');
  }
}

export async function getElectrumConnectionDetails(): Promise<ConnectionDetails> {
  try {
    const addressUnformatted = await diskLogic.readElectrumHiddenService();
    const address = addressUnformatted.trim();
    const port = constants.ELECTRUM_PORT;
    const connectionString = `${address}:${port}:t`;
    return {
      address,
      port,
      connectionString,
    };
  } catch {
    throw new Error('Unable to get Electrum hidden service url');
  }
}

export async function getBitcoinP2pConnectionDetails(): Promise<ConnectionDetails> {
  try {
    const address = await diskLogic.readBitcoinP2pHiddenService();
    const port = constants.BITCOIN_P2P_PORT;
    const connectionString = `${address}:${port}`;
    return {
      address,
      port,
      connectionString,
    };
  } catch {
    throw new Error('Unable to get Bitcoin P2P hidden service url');
  }
}

export async function getBitcoinRpcConnectionDetails(): Promise<RpcConnectionDetails> {
  try {
    const [user, hiddenService] = await Promise.all([
      diskLogic.readUserFile(),
      diskLogic.readBitcoinRpcHiddenService(),
    ]);
    const label = encodeURIComponent(`${user.name}'s Citadel`);
    const rpcuser = constants.BITCOIN_RPC_USER;
    const rpcpassword = constants.BITCOIN_RPC_PASSWORD;
    const address = hiddenService;
    const port = constants.BITCOIN_RPC_PORT;
    const connectionString = `btcrpc://${rpcuser}:${rpcpassword}@${address}:${port}?label=${label}`;
    return {
      rpcuser,
      rpcpassword,
      address,
      port,
      connectionString,
    };
  } catch {
    throw new Error('Unable to get Bitcoin RPC connection details');
  }
}

export async function getAvailableUpdate(): Promise<versionFile | string> {
  try {
    const current = await diskLogic.readVersionFile();
    const currentVersion = current.version;

    // 'tag' should be the default Git branch
    let tag = constants.GITHUB_BRANCH;
    let data: versionFile | undefined;
    let isNewVersionAvailable = true;
    let isCompatibleWithCurrentVersion = false;

    // Try finding for a new update until there's a new version available
    // which is compatible with the currently installed version
    while (isNewVersionAvailable && !isCompatibleWithCurrentVersion) {
      const infoUrl = `https://raw.githubusercontent.com/${constants.GITHUB_REPO}/${tag}/info.json`;

      // eslint-disable-next-line no-await-in-loop
      const latestVersionInfo = await nodeFetch(infoUrl, {agent});
      // eslint-disable-next-line no-await-in-loop
      data = (await latestVersionInfo.json()) as versionFile;

      const latestVersion = data.version;
      const requiresVersionRange = data.requires;

      // A new version is available if the latest version > local version
      isNewVersionAvailable = semver.gt(latestVersion, currentVersion);

      // It's compatible with the current version if current version
      // satisfies the 'requires' condition of the new version
      isCompatibleWithCurrentVersion = semver.satisfies(
        currentVersion,
        requiresVersionRange,
      );

      // Calculate the minimum required version
      const minimumVersionRequired = `v${
        semver.minVersion(requiresVersionRange)!.raw
      }`;

      // If the minimum required version is what we just checked for, exit
      // This usually happens when an OTA update breaking release x.y.z is made
      // that also has x.y.z as the minimum required version
      if (tag === minimumVersionRequired) {
        break;
      }

      // Update tag to the minimum required version for the next loop run
      tag = minimumVersionRequired;
    }

    if (isNewVersionAvailable && isCompatibleWithCurrentVersion) {
      return data!;
    }

    return 'Your Citadel is up-to-date';
  } catch {
    throw new Error('Unable to check for update');
  }
}

export async function getUpdateStatus(): Promise<updateStatus> {
  try {
    const status = await diskLogic.readUpdateStatusFile();
    return status;
  } catch {
    throw new Error('Unable to get update status');
  }
}

export async function startUpdate(): Promise<{message: string} | string> {
  let availableUpdate;

  // Fetch available update
  try {
    availableUpdate = await getAvailableUpdate();
    if (typeof availableUpdate === 'string') return availableUpdate;
  } catch {
    throw new Error('Unable to fetch latest release');
  }

  // Make sure an update is not already in progress
  const updateInProgress = await diskLogic.updateLockFileExists();
  if (updateInProgress) {
    throw new Error('An update is already in progress');
  }

  // Update status file with update version
  try {
    const updateStatus = await diskLogic.readUpdateStatusFile();
    updateStatus.updateTo = `v${availableUpdate.version}`;
    await diskLogic.writeUpdateStatusFile(updateStatus);
  } catch {
    throw new Error('Could not update the update-status file');
  }

  // Write update signal file
  try {
    await diskLogic.writeUpdateSignalFile();
    return {message: 'Updating to Citadel v' + availableUpdate.version};
  } catch {
    throw new Error('Unable to write update signal file');
  }
}

export async function getBackupStatus(): Promise<backupStatus> {
  try {
    const status = await diskLogic.readBackupStatusFile();
    return status;
  } catch {
    throw new Error('Unable to get backup status');
  }
}

export async function getLndConnectUrls(): Promise<LndConnectionDetails> {
  let cert;
  try {
    cert = await diskLogic.readLndCert();
  } catch {
    throw new Error('Unable to read lnd cert file');
  }

  let macaroon: string;
  try {
    const macaroonBuffer = await diskLogic.readLndAdminMacaroon();
    macaroon = macaroonBuffer.toString('hex');
  } catch {
    throw new Error('Unable to read lnd macaroon file');
  }

  let restTorHost;
  try {
    restTorHost = await diskLogic.readLndRestHiddenService();
    restTorHost += ':8080';
  } catch {
    throw new Error('Unable to read lnd REST hostname file');
  }

  const restTor = encode({
    host: restTorHost,
    cert,
    macaroon,
  });

  let grpcTorHost;
  try {
    grpcTorHost = await diskLogic.readLndGrpcHiddenService();
    grpcTorHost += ':10009';
  } catch {
    throw new Error('Unable to read lnd gRPC hostname file');
  }

  const grpcTor = encode({
    host: grpcTorHost,
    cert,
    macaroon,
  });

  const restLocalHost = `${constants.DEVICE_HOSTNAME}:8080`;
  const restLocal = encode({
    host: restLocalHost,
    cert,
    macaroon,
  });

  const grpcLocalHost = `${constants.DEVICE_HOSTNAME}:10009`;
  const grpcLocal = encode({
    host: grpcLocalHost,
    cert,
    macaroon,
  });

  return {
    restTor,
    restLocal,
    grpcTor,
    grpcLocal,
  };
}

export async function getLnConnectUrls(
  lightningImplementation: 'lnd' | 'c-lightning' | 'c-lightning-rest',
): Promise<LndConnectionDetails> {
  let cert;
  try {
    cert = await diskLogic.readLndCert();
  } catch {
    throw new Error('Unable to read lnd cert file');
  }

  let macaroon: string;
  try {
    const macaroonBuffer = await diskLogic.readLndAdminMacaroon();
    macaroon = macaroonBuffer.toString('hex');
  } catch {
    throw new Error('Unable to read lnd macaroon file');
  }

  let restTorHost;
  try {
    restTorHost = await diskLogic.readLndRestHiddenService();
    restTorHost += ':8080';
  } catch {
    throw new Error('Unable to read lnd REST hostname file');
  }

  if (lightningImplementation === 'c-lightning')
    lightningImplementation = 'c-lightning-rest';

  const restTor = encode({
    host: restTorHost,
    cert,
    macaroon,
    server: lightningImplementation,
    version: UrlVersion.LNCONNECT_UNIVERSAL_V0,
  });

  let grpcTorHost;
  try {
    grpcTorHost = await diskLogic.readLndGrpcHiddenService();
    grpcTorHost += ':10009';
  } catch {
    throw new Error('Unable to read lnd gRPC hostname file');
  }

  const grpcTor = encode({
    host: grpcTorHost,
    cert,
    macaroon,
    server: lightningImplementation,
    version: UrlVersion.LNCONNECT_UNIVERSAL_V0,
  });

  const restLocalHost = `${constants.DEVICE_HOSTNAME}:8080`;
  const restLocal = encode({
    host: restLocalHost,
    cert,
    macaroon,
    server: lightningImplementation,
    version: UrlVersion.LNCONNECT_UNIVERSAL_V0,
  });

  const grpcLocalHost = `${constants.DEVICE_HOSTNAME}:10009`;
  const grpcLocal = encode({
    host: grpcLocalHost,
    cert,
    macaroon,
    server: lightningImplementation,
    version: UrlVersion.LNCONNECT_UNIVERSAL_V0,
  });

  return {
    restTor,
    restLocal,
    grpcTor,
    grpcLocal,
  };
}

export async function requestDebug(): Promise<string> {
  try {
    await diskLogic.writeSignalFile('debug');
    return 'Debug requested';
  } catch {
    throw new Error('Could not write the signal file');
  }
}

export async function getDebugResult(): Promise<debugStatus> {
  try {
    return await diskLogic.readDebugStatusFile();
  } catch {
    throw new Error('Unable to get debug results');
  }
}

export async function requestShutdown(): Promise<string> {
  try {
    await diskLogic.shutdown();
    return 'Shutdown requested';
  } catch {
    throw new Error('Unable to request shutdown');
  }
}

export async function requestReboot(): Promise<string> {
  try {
    await diskLogic.reboot();
    return 'Reboot requested';
  } catch {
    throw new Error('Unable to request reboot');
  }
}
