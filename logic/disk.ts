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

type UserSettings = {
  twoFactorAuth: boolean;
  twoFactorKey: string | false;
};

export type UserFile = {
  /** The user's name */
  name: string;
  /** The users password, hashed by bcrypt */
  password?: string;
  /** The users mnemoic LND seed */
  seed?: string | Buffer | ArrayBuffer;
  /** The list of IDs of installed apps */
  installedApps?: string[];
  /** User settings */
  settings?: UserSettings;
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

export async function readUserFile(): Promise<UserFile> {
  const defaultProperties: UserFile = {
    name: '',
    password: '',
    seed: '',
    installedApps: [],
  };
  const userFile = (await fs.readJSONFile(constants.USER_FILE)) as UserFile;
  return {...defaultProperties, ...userFile};
}

export async function writeUserFile(json: UserFile): Promise<void> {
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
  return readHiddenService('electrum');
}

export async function readBitcoinP2pHiddenService(): Promise<string> {
  return readHiddenService('bitcoin-p2p');
}

export async function readBitcoinRpcHiddenService(): Promise<string> {
  return readHiddenService('bitcoin-rpc');
}

export async function readLndRestHiddenService(): Promise<string> {
  return readHiddenService('lnd-rest');
}

export async function readLndGrpcHiddenService(): Promise<string> {
  return readHiddenService('lnd-grpc');
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
  return readJsonStatusFile<updateStatus>('update');
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
  return readJsonStatusFile<backupStatus>('backup');
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
  return readJsonStatusFile<debugStatus>('debug');
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

export async function readStatusFile<FileType = unknown>(
  statusFile: string,
): Promise<FileType> {
  if (!/^[\w-]+$/.test(statusFile)) {
    throw new Error('Invalid status file characters');
  }

  const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
  return (await fs.readJSONFile(statusFilePath)) as FileType;
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

export async function readTextStatusFile(resource: string): Promise<Buffer> {
  const statusFilePath = path.join(constants.STATUS_DIR, resource);
  return fs.readFile(statusFilePath);
}

export async function readJsonStatusFile<FileType = unknown>(
  resource: string,
): Promise<FileType> {
  const statusFilePath = path.join(
    constants.STATUS_DIR,
    `${resource}-status.json`,
  );
  return (await fs.readJSONFile(statusFilePath).catch(() => null)) as FileType;
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
