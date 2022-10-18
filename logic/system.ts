import * as semver from "https://deno.land/std@0.159.0/semver/mod.ts";
import { encode as encodeLnurl } from "https://deno.land/x/lndconnect@v1.0.1/mod.ts";
import { encode as encodeHex } from "https://deno.land/std@0.159.0/encoding/hex.ts";

import type {
  backupStatus,
  debugStatus,
  systemStatus,
  updateStatus,
} from "../utils/types.ts";
import constants from "../utils/const.ts";
import { runCommand } from "../services/karen.ts";
import * as appsLogic from "./apps.ts";
import * as diskLogic from "./disk.ts";

const tor = Deno.createHttpClient({
  proxy: {
    url: `socks5h://${constants.TOR_PROXY_IP}:${constants.TOR_PROXY_PORT}`,
  },
});

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

export type VersionFile = {
  version: string;
  name: string;
  requires: string;
  notes: string;
  isQuickUpdate?: boolean;
};

export async function getInfo(): Promise<VersionFile> {
  try {
    const info = await diskLogic.readVersionFile();
    return info;
  } catch {
    throw new Error("Unable to get system information");
  }
}

export async function getElectrumConnectionDetails(): Promise<
  ConnectionDetails
> {
  try {
    const electrum = await appsLogic.getImplementation("electrum");
    if (!electrum) {
      throw new Error("No electrum implementation found!");
    }
    const addressUnformatted = await diskLogic.readHiddenService(`app-${electrum}-service`);
    const address = addressUnformatted.trim();
    const port = constants.ELECTRUM_PORT;
    const connectionString = `${address}:${port}:t`;
    return {
      address,
      port,
      connectionString,
    };
  } catch {
    throw new Error("Unable to get Electrum hidden service url");
  }
}

export async function getBitcoinP2pConnectionDetails(): Promise<
  ConnectionDetails
> {
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
    throw new Error("Unable to get Bitcoin P2P hidden service url");
  }
}

export async function getBitcoinRpcConnectionDetails(): Promise<
  RpcConnectionDetails
> {
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
    const connectionString =
      `btcrpc://${rpcuser}:${rpcpassword}@${address}:${port}?label=${label}`;
    return {
      rpcuser,
      rpcpassword,
      address,
      port,
      connectionString,
    };
  } catch {
    throw new Error("Unable to get Bitcoin RPC connection details");
  }
}

export async function getAvailableUpdate(): Promise<VersionFile | string> {
  try {
    const current = await diskLogic.readVersionFile();
    const currentVersion = current.version;

    // 'tag' should be the default Git branch
    let tag = constants.GITHUB_BRANCH;
    let data: VersionFile | undefined;
    let isNewVersionAvailable = true;
    let isCompatibleWithCurrentVersion = false;

    // Try finding for a new update until there's a new version available
    // which is compatible with the currently installed version
    while (isNewVersionAvailable && !isCompatibleWithCurrentVersion) {
      const infoUrl =
        `https://raw.githubusercontent.com/${constants.GITHUB_REPO}/${tag}/info.json`;

      // eslint-disable-next-line no-await-in-loop
      const latestVersionInfo = await fetch(infoUrl, {
        client: tor,
      });
      // eslint-disable-next-line no-await-in-loop
      data = JSON.parse(await latestVersionInfo.json()) as VersionFile;

      const latestVersion = data.version;
      const requiresVersionRange = data.requires;

      // A new version is available if the latest version > local version
      isNewVersionAvailable = semver.gt(latestVersion, currentVersion);

      // It's compatible with the current version if current version
      // satisfies the 'requires' condition of the new version
      isCompatibleWithCurrentVersion = semver.satisfies(
        currentVersion,
        requiresVersionRange,
        {
          includePrerelease: true,
        },
      );

      // Calculate the minimum required version
      const minimumVersionRequired = `v${semver.minVersion(requiresVersionRange)!.raw
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

    return "Your Citadel is up-to-date";
  } catch (err) {
    console.error(err);
    throw new Error("Unable to check for update");
  }
}

export async function getUpdateStatus(): Promise<updateStatus> {
  try {
    const status = await diskLogic.readUpdateStatusFile();
    return status;
  } catch {
    throw new Error("Unable to get update status");
  }
}

export async function startUpdate(): Promise<{ message: string } | string> {
  let availableUpdate;

  // Fetch available update
  try {
    availableUpdate = await getAvailableUpdate();
    if (typeof availableUpdate === "string") return availableUpdate;
  } catch {
    throw new Error("Unable to fetch latest release");
  }

  // Make sure an update is not already in progress
  const updateInProgress = await diskLogic.updateLockFileExists();
  if (updateInProgress) {
    throw new Error("An update is already in progress");
  }

  // Update status file with update version
  try {
    const updateStatus = await diskLogic.readUpdateStatusFile();
    updateStatus.updateTo = `v${availableUpdate.version}`;
    await diskLogic.writeUpdateStatusFile(updateStatus);
  } catch {
    throw new Error("Could not update the update-status file");
  }

  try {
    await runCommand("trigger update");
    return { message: "Updating to Citadel v" + availableUpdate.version };
  } catch {
    throw new Error("Unable to get backup status");
  }
}

export async function getBackupStatus(): Promise<backupStatus> {
  try {
    const status = await diskLogic.readBackupStatusFile();
    return status;
  } catch {
    throw new Error("Unable to get backup status");
  }
}

export async function getLndConnectUrls(): Promise<LndConnectionDetails> {
  let cert;
  try {
    cert = await diskLogic.readLndCert();
  } catch {
    throw new Error("Unable to read lnd cert file");
  }

  let macaroon: string;
  try {
    const macaroonBuffer = await diskLogic.readLndAdminMacaroon();
    macaroon = new TextDecoder().decode(encodeHex(macaroonBuffer));
  } catch {
    throw new Error("Unable to read lnd macaroon file");
  }

  let restTorHost;
  try {
    restTorHost = await diskLogic.readLndRestHiddenService();
    restTorHost += ":8080";
  } catch {
    throw new Error("Unable to read lnd REST hostname file");
  }

  const restTor = encodeLnurl({
    host: restTorHost,
    cert,
    macaroon,
  });

  let grpcTorHost;
  try {
    grpcTorHost = await diskLogic.readLndGrpcHiddenService();
    grpcTorHost += ":10009";
  } catch {
    throw new Error("Unable to read lnd gRPC hostname file");
  }

  const grpcTor = encodeLnurl({
    host: grpcTorHost,
    cert,
    macaroon,
  });

  const restLocalHost = `${constants.DEVICE_HOSTNAME}:8080`;
  const restLocal = encodeLnurl({
    host: restLocalHost,
    cert,
    macaroon,
  });

  const grpcLocalHost = `${constants.DEVICE_HOSTNAME}:10009`;
  const grpcLocal = encodeLnurl({
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

export async function requestDebug(): Promise<debugStatus> {
  try {
    await runCommand("trigger debug");
    return {
      status: "requested",
      debug: null,
      dmesg: null,
    };
  } catch {
    throw new Error("Could not communicate with karen");
  }
}

export async function getDebugResult(): Promise<debugStatus> {
  try {
    return await diskLogic.readDebugStatusFile();
  } catch {
    throw new Error("Unable to get debug results");
  }
}

export async function requestShutdown(): Promise<systemStatus> {
  try {
    await runCommand("trigger shutdown");
    return {
      type: "shutdown",
      status: "requested",
    };
  } catch {
    throw new Error("Unable to request shutdown");
  }
}

export async function requestReboot(): Promise<systemStatus> {
  try {
    await runCommand("trigger reboot");
    return {
      type: "reboot",
      status: "requested",
    };
  } catch {
    throw new Error("Unable to request reboot");
  }
}

export function setUpdateChannel(channel: string): Promise<void> {
  return runCommand(`trigger set-update-channel ${channel}`);
}

export function startQuickUpdate(): Promise<void> {
  return runCommand(`trigger quick-update`);
}
