import * as path from 'node:path';

import * as fs from 'node:fs/promises';
import {Buffer} from 'node:buffer';
import {fs_utils} from '@runcitadel/utils';

import type {
  user as userFile,
  backupStatus,
  updateStatus,
  versionFile,
  debugStatus,
} from '@runcitadel/utils';
import constants from '../utils/const.js';
import {app} from './apps.js';

export async function deleteUserFile(): Promise<void> {
  await fs.unlink(constants.USER_FILE);
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.readFile(path);
    return true;
  } catch {
    return false;
  }
}

export async function readUserFile(): Promise<userFile> {
  const defaultProperties: userFile = {
    name: '',
    password: '',
    seed: '',
    installedApps: [],
  };
  const userFile: userFile = (await fs_utils.readJsonFile(
    constants.USER_FILE,
  )) as userFile;
  return {...defaultProperties, ...userFile};
}

export async function writeUserFile(json: userFile): Promise<void> {
  return fs_utils.writeJsonFile(constants.USER_FILE, json);
}

export async function writeSeedFile(
  seed: string,
): Promise<void | NodeJS.ErrnoException> {
  return ensureWriteFile(constants.SEED_FILE, seed);
}

export async function seedFileExists(): Promise<boolean> {
  return fileExists(constants.SEED_FILE);
}

export async function hiddenServiceFileExists(): Promise<boolean> {
  return fileExists(constants.DASHBOARD_HIDDEN_SERVICE_FILE);
}

export async function readElectrumHiddenService(): Promise<string> {
  return fs_utils.readUtf8File(constants.ELECTRUM_HIDDEN_SERVICE_FILE);
}

export async function readBitcoinP2PHiddenService(): Promise<string> {
  return fs_utils.readUtf8File(constants.BITCOIN_P2P_HIDDEN_SERVICE_FILE);
}

export async function readBitcoinRPCHiddenService(): Promise<string> {
  return fs_utils.readUtf8File(constants.BITCOIN_RPC_HIDDEN_SERVICE_FILE);
}

export async function readLndRestHiddenService(): Promise<string> {
  return fs_utils.readUtf8File(constants.LND_REST_HIDDEN_SERVICE_FILE);
}

export async function readLndGrpcHiddenService(): Promise<string> {
  return fs_utils.readUtf8File(constants.LND_GRPC_HIDDEN_SERVICE_FILE);
}

export async function readLndCert(): Promise<string> {
  return fs_utils.readUtf8File(constants.LND_CERT_FILE);
}

export async function readLndAdminMacaroon(): Promise<Buffer> {
  return fs.readFile(constants.LND_ADMIN_MACAROON_FILE);
}

export async function readVersionFile(): Promise<versionFile> {
  return (await fs_utils.readJsonFile(constants.VERSION_FILE)) as versionFile;
}

export async function readUpdateStatusFile(): Promise<updateStatus> {
  return (await readJsonStatusFile('update')) as updateStatus;
}

export async function writeUpdateStatusFile(json: updateStatus): Promise<void> {
  await writeStatusFile('update-status.json', JSON.stringify(json));
}

export async function updateSignalFileExists(): Promise<boolean> {
  try {
    await statusFileExists('update-status.json');
    return true;
  } catch {
    return false;
  }
}

export async function updateLockFileExists(): Promise<boolean> {
  return statusFileExists('update-in-progress');
}

export async function writeUpdateSignalFile(): Promise<void> {
  await writeSignalFile('update');
}

export async function readBackupStatusFile(): Promise<backupStatus> {
  return (await readJsonStatusFile('backup')) as backupStatus;
}

export async function readJWTPrivateKeyFile(): Promise<string> {
  return fs_utils.readUtf8File(constants.JWT_PRIVATE_KEY_FILE);
}

export async function readJWTPublicKeyFile(): Promise<string> {
  return fs_utils.readUtf8File(constants.JWT_PUBLIC_KEY_FILE);
}

export async function writeJWTPrivateKeyFile(data: string): Promise<void> {
  return fs_utils.safeWriteFile(constants.JWT_PRIVATE_KEY_FILE, data);
}

export async function writeJWTPublicKeyFile(data: string): Promise<void> {
  return fs_utils.safeWriteFile(constants.JWT_PUBLIC_KEY_FILE, data);
}

export async function shutdown(): Promise<void> {
  await writeSignalFile('shutdown');
}

export async function reboot(): Promise<void> {
  await writeSignalFile('reboot');
}

// Read the contends of a file.
export async function readUtf8File(path: string): Promise<string> {
  return fs_utils.readUtf8File(path);
}

// Read the contents of a file and return a json object.
export async function readJsonFile(path: string): Promise<unknown> {
  return fs_utils.readJsonFile(path);
}

export async function readDebugStatusFile(): Promise<debugStatus> {
  return (await readJsonStatusFile('debug')) as debugStatus;
}

export async function writeSignalFile(
  signalFile: string,
): Promise<void | NodeJS.ErrnoException> {
  if (!/^[\w-]+$/.test(signalFile)) {
    throw new Error('Invalid signal file characters');
  }

  const signalFilePath = path.join(constants.SIGNAL_DIR, signalFile);
  return ensureWriteFile(signalFilePath, 'true');
}

export async function writeStatusFile(
  statusFile: string,
  contents: string,
): Promise<void> {
  if (!/^[\w-]+$/.test(statusFile)) {
    throw new Error('Invalid signal file characters');
  }

  const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
  return fs_utils.safeWriteFile(statusFilePath, contents);
}

export async function readStatusFile(statusFile: string): Promise<unknown> {
  if (!/^[\w-]+$/.test(statusFile)) {
    throw new Error('Invalid signal file characters');
  }

  const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
  return fs_utils.readJsonFile(statusFilePath);
}

export async function statusFileExists(statusFile: string): Promise<boolean> {
  if (!/^[\w-]+$/.test(statusFile)) {
    throw new Error('Invalid signal file characters');
  }

  const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
  return fileExists(statusFilePath);
}

export async function deleteStatusFile(statusFile: string): Promise<void> {
  if (!/^[\w-]+$/.test(statusFile)) {
    throw new Error('Invalid signal file characters');
  }

  const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
  await fs.unlink(statusFilePath);
}

export async function readAppRegistry(): Promise<app[]> {
  const appRegistryFile = path.join(constants.APPS_DIR, 'registry.json');
  return (await fs_utils.readJsonFile(appRegistryFile)) as app[];
}

export async function readHiddenService(id: string): Promise<string> {
  if (!/^[\w-]+$/.test(id)) {
    throw new Error('Invalid hidden service ID');
  }

  const hiddenServiceFile = path.join(
    constants.TOR_HIDDEN_SERVICE_DIR,
    id,
    'hostname',
  );
  return fs_utils.readUtf8File(hiddenServiceFile);
}

export async function memoryWarningStatusFileExists(): Promise<boolean> {
  return statusFileExists('memory-warning');
}

export async function deleteMemoryWarningStatusFile(): Promise<void | NodeJS.ErrnoException> {
  return deleteStatusFile('memory-warning');
}

export async function readJsonStatusFile(resource: string): Promise<unknown> {
  const statusFilePath = path.join(
    constants.STATUS_DIR,
    `${resource}-status.json`,
  );
  return fs_utils.readJsonFile(statusFilePath).catch(() => null);
}

export async function ensureWriteFile(
  filePath: string,
  data: string,
): Promise<NodeJS.ErrnoException | void> {
  const time = new Date();
  try {
    await fs.utimes(filePath, time, time);
  } catch {
    await (await fs.open(filePath, 'w')).close();
  }

  await fs_utils.safeWriteFile(filePath, data);
}
