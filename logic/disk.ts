/* eslint-disable import/namespace */
import * as path from 'node:path';

import {Buffer} from 'node:buffer';
import * as fs from '@runcitadel/fs';

import type {
  backupStatus,
  updateStatus,
  versionFile,
  debugStatus,
} from '@runcitadel/utils';
import * as constants from '../utils/const.js';
import type {App} from './apps.js';

type userSettings = {
  twoFactorAuth: boolean;
  twoFactorKey: string | false;
};

type userFile = {
  /** The user's name */
  name: string;
  /** The users password, hashed by bcrypt */
  password?: string;
  /** The users mnemoic LND seed */
  seed?: string | Buffer | ArrayBuffer;
  /** The list of IDs of installed apps */
  installedApps?: string[];
  /** User settings */
  settings?: userSettings;
};

export async function deleteUserFile(): Promise<void> {
  await fs.unlink(constants.USER_FILE);
}

export async function disable2fa(): Promise<void> {
  const userFile = await readUserFile();
  userFile.settings = {
    ...userFile.settings,
    twoFactorAuth: false,
    twoFactorKey: false,
  };
  await writeUserFile(userFile);
}

export async function setup2fa(key: string): Promise<void> {
  const userFile = await readUserFile();
  userFile.settings = {
    ...userFile.settings,
    twoFactorAuth: false,
    twoFactorKey: key,
  };
  await writeUserFile(userFile);
}

export async function enable2fa(key: string): Promise<void> {
  const userFile = await readUserFile();
  userFile.settings = {
    ...userFile.settings,
    twoFactorAuth: true,
    twoFactorKey: key,
  };
  await writeUserFile(userFile);
}

export async function is2faEnabled(): Promise<boolean> {
  const userFile = await readUserFile();
  return userFile.settings?.twoFactorAuth ?? false;
}

export async function readUserFile(): Promise<userFile> {
  const defaultProperties: userFile = {
    name: '',
    password: '',
    seed: '',
    installedApps: [],
  };
  const userFile: userFile = (await fs.readJSONFile(
    constants.USER_FILE,
  )) as userFile;
  return {...defaultProperties, ...userFile};
}

export async function writeUserFile(json: userFile): Promise<void> {
  await fs.writeJsonFile(constants.USER_FILE, json);
}

export async function writeSeedFile(
  seed: string,
): Promise<void | NodeJS.ErrnoException> {
  return fs.ensureWriteFile(constants.SEED_FILE, seed);
}

export async function readSeedFile(): Promise<Buffer | string> {
  return fs.readFile(constants.SEED_FILE);
}

export function seedFileExists(): boolean {
  return fs.existsSync(constants.SEED_FILE);
}

export async function readElectrumHiddenService(): Promise<string> {
  return fs.readUtf8File(constants.ELECTRUM_HIDDEN_SERVICE_FILE);
}

export async function readBitcoinP2pHiddenService(): Promise<string> {
  return fs.readUtf8File(constants.BITCOIN_P2P_HIDDEN_SERVICE_FILE);
}

export async function readBitcoinRpcHiddenService(): Promise<string> {
  return fs.readUtf8File(constants.BITCOIN_RPC_HIDDEN_SERVICE_FILE);
}

export async function readLndRestHiddenService(): Promise<string> {
  return fs.readUtf8File(constants.LND_REST_HIDDEN_SERVICE_FILE);
}

export async function readLndGrpcHiddenService(): Promise<string> {
  return fs.readUtf8File(constants.LND_GRPC_HIDDEN_SERVICE_FILE);
}

export async function readLndCert(): Promise<string> {
  return fs.readUtf8File(constants.LND_CERT_FILE);
}

export async function readLndAdminMacaroon(): Promise<Buffer> {
  return fs.readFile(constants.LND_ADMIN_MACAROON_FILE);
}

export async function readVersionFile(): Promise<versionFile> {
  return (await fs.readJSONFile(constants.VERSION_FILE)) as versionFile;
}

export async function readUpdateStatusFile(): Promise<updateStatus> {
  return (await readJsonStatusFile('update')) as updateStatus;
}

export async function writeUpdateStatusFile(json: updateStatus): Promise<void> {
  await writeJsonStatusFile('update', json);
}

export async function updateSignalFileExists(): Promise<boolean> {
  return statusFileExists('update-status.json');
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

export async function readJwtPrivateKeyFile(): Promise<string> {
  return fs.readUtf8File(constants.JWT_PRIVATE_KEY_FILE);
}

export async function readJwtPublicKeyFile(): Promise<string> {
  return fs.readUtf8File(constants.JWT_PUBLIC_KEY_FILE);
}

export async function writeJwtPrivateKeyFile(data: string): Promise<void> {
  return fs.safeWriteFile(constants.JWT_PRIVATE_KEY_FILE, data);
}

export async function writeJwtPublicKeyFile(data: string): Promise<void> {
  return fs.safeWriteFile(constants.JWT_PUBLIC_KEY_FILE, data);
}

export async function shutdown(): Promise<void> {
  await writeSignalFile('shutdown');
}

export async function reboot(): Promise<void> {
  await writeSignalFile('reboot');
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
  await fs.touch(signalFilePath);
  await fs.writeFile(signalFilePath, 'true');
}

export async function writeStatusFile(
  statusFile: string,
  contents: string,
): Promise<void | NodeJS.ErrnoException> {
  if (!/^[\w-]+$/.test(statusFile)) {
    throw new Error('Invalid status file characters');
  }

  const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
  return fs.ensureWriteFile(statusFilePath, contents);
}

export async function readStatusFile(statusFile: string): Promise<unknown> {
  if (!/^[\w-]+$/.test(statusFile)) {
    throw new Error('Invalid status file characters');
  }

  const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
  return fs.readJSONFile(statusFilePath);
}

export function statusFileExists(statusFile: string): boolean {
  if (!/^[\w-]+$/.test(statusFile)) {
    throw new Error('Invalid status file characters');
  }

  const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
  return fs.existsSync(statusFilePath);
}

export async function deleteStatusFile(statusFile: string): Promise<void> {
  if (!/^[\w-]+$/.test(statusFile)) {
    throw new Error('Invalid status file characters');
  }

  const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
  await fs.unlink(statusFilePath);
}

export async function readAppRegistry(): Promise<App[]> {
  const appRegistryFile = path.join(constants.APPS_DIR, 'registry.json');
  return (await fs.readJSONFile(appRegistryFile)) as App[];
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
  return fs.readUtf8File(hiddenServiceFile);
}

export async function memoryWarningStatusFileExists(): Promise<boolean> {
  return statusFileExists('memory-warning');
}

export async function deleteMemoryWarningStatusFile(): Promise<void | NodeJS.ErrnoException> {
  return deleteStatusFile('memory-warning');
}

export async function readTextStatusFile(resource: string): Promise<Buffer> {
  const statusFilePath = path.join(constants.STATUS_DIR, resource);
  return await fs.readFile(statusFilePath);
}

export async function readJsonStatusFile(resource: string): Promise<unknown> {
  const statusFilePath = path.join(
    constants.STATUS_DIR,
    `${resource}-status.json`,
  );
  return fs.readJSONFile(statusFilePath).catch(() => null);
}

export async function writeJsonStatusFile(
  resource: string,
  data: unknown,
): Promise<void | NodeJS.ErrnoException> {
  const statusFilePath = path.join(
    constants.STATUS_DIR,
    `${resource}-status.json`,
  );
  await fs.touch(statusFilePath);
  return fs.writeJsonFile(statusFilePath, data);
}
/* eslint-enable import/namespace */
