import type {
  backupStatus,
  debugStatus,
  updateStatus,
  versionFile,
} from "https://esm.sh/@runcitadel/utils@0.9.2";
import constants from "../utils/const.ts";
import { runCommand } from "../services/karen.ts";
import type { App } from "./apps.ts";
import {
  ensureFile,
  exists,
  existsSync,
} from "https://deno.land/std@0.153.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.153.0/path/mod.ts";
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
  seed?: string;
  /** The list of IDs of installed apps */
  installedApps?: string[];
  /** User settings */
  settings?: UserSettings;
};

function getRandomString(s: number) {
  if (s % 2 == 1) {
    throw new Deno.errors.InvalidData("Only even sizes are supported");
  }
  const buf = new Uint8Array(s / 2);
  crypto.getRandomValues(buf);
  let ret = "";
  for (let i = 0; i < buf.length; ++i) {
    ret += ("0" + buf[i].toString(16)).slice(-2);
  }
  return ret;
}

async function readJsonFile<T = unknown>(path: string): Promise<T> {
  const contents = await Deno.readTextFile(path);
  return JSON.parse(contents) as T;
}

function writeJsonFile(path: string, data: unknown): Promise<void> {
  return Deno.writeTextFile(path, JSON.stringify(data));
}

async function safeWriteTextFile(
  filePath: string,
  data: string,
): Promise<void> {
  const tempFileName = `${filePath}.${getRandomString(8)}`;

  await Deno.writeTextFile(tempFileName, data);
  try {
    await Deno.rename(tempFileName, filePath);
  } catch (err) {
    await Deno.remove(tempFileName);
    throw err;
  }
}

export function deleteUserFile(): Promise<void> {
  return Deno.remove(constants.USER_FILE);
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
    name: "",
    password: "",
    seed: "",
    installedApps: [],
  };
  const userFile = (await readJsonFile(constants.USER_FILE)) as UserFile;
  return { ...defaultProperties, ...userFile };
}

export async function writeUserFile(json: UserFile): Promise<void> {
  await writeJsonFile(constants.USER_FILE, json);
}

export async function writeSeedFile(
  seed: string,
): Promise<void> {
  await ensureFile(constants.SEED_FILE);
  return Deno.writeTextFile(constants.SEED_FILE, seed);
}

export function readSeedFile(): Promise<string> {
  return Deno.readTextFile(constants.SEED_FILE);
}

export function seedFileExists(): boolean {
  return existsSync(constants.SEED_FILE);
}

export function readBitcoinP2pHiddenService(): Promise<string> {
  return readHiddenService("bitcoin-p2p");
}

export function readBitcoinRpcHiddenService(): Promise<string> {
  return readHiddenService("bitcoin-rpc");
}

export function readLndRestHiddenService(): Promise<string> {
  return readHiddenService("lnd-rest");
}

export function readLndGrpcHiddenService(): Promise<string> {
  return readHiddenService("lnd-grpc");
}

export function readLndCert(): Promise<string> {
  return Deno.readTextFile(constants.LND_CERT_FILE);
}

export function readLndAdminMacaroon(): Promise<Uint8Array> {
  return Deno.readFile(constants.LND_ADMIN_MACAROON_FILE);
}

export function readVersionFile(): Promise<versionFile> {
  return readJsonFile(constants.VERSION_FILE);
}

export function readUpdateStatusFile(): Promise<updateStatus> {
  return readJsonStatusFile<updateStatus>("update");
}

export async function writeUpdateStatusFile(json: updateStatus): Promise<void> {
  await writeJsonStatusFile("update", json);
}

export function updateLockFileExists(): Promise<boolean> {
  return statusFileExists("update-in-progress");
}

export function readBackupStatusFile(): Promise<backupStatus> {
  return readJsonStatusFile<backupStatus>("backup");
}

export function readJwtPrivateKeyFile(): Promise<string> {
  return Deno.readTextFile(constants.JWT_PRIVATE_KEY_FILE);
}

export function readJwtPublicKeyFile(): Promise<string> {
  return Deno.readTextFile(constants.JWT_PUBLIC_KEY_FILE);
}

export function writeJwtPrivateKeyFile(data: string): Promise<void> {
  return safeWriteTextFile(constants.JWT_PRIVATE_KEY_FILE, data);
}

export function writeJwtPublicKeyFile(data: string): Promise<void> {
  return safeWriteTextFile(constants.JWT_PUBLIC_KEY_FILE, data);
}

export function shutdown(): Promise<void> {
  return runCommand("trigger shutdown");
}

export function reboot(): Promise<void> {
  return runCommand("trigger reboot");
}

export function readDebugStatusFile(): Promise<debugStatus> {
  return readJsonStatusFile<debugStatus>("debug");
}

export async function writeStatusFile(
  statusFile: string,
  contents: string,
): Promise<void | NodeJS.ErrnoException> {
  if (!/^[\w-]+$/.test(statusFile)) {
    throw new Error("Invalid status file characters");
  }

  const statusFilePath = join(constants.STATUS_DIR, statusFile);
  await ensureFile(statusFilePath);
  return Deno.writeTextFile(statusFilePath, contents);
}

export async function readStatusFile<FileType = unknown>(
  statusFile: string,
): Promise<FileType> {
  if (!/^[\w-]+$/.test(statusFile)) {
    throw new Error("Invalid status file characters");
  }

  const statusFilePath = join(constants.STATUS_DIR, statusFile);
  return (await readJsonFile(statusFilePath)) as FileType;
}

export function statusFileExists(statusFile: string): Promise<boolean> {
  if (!/^[\w-]+$/.test(statusFile)) {
    throw new Error("Invalid status file characters");
  }

  const statusFilePath = join(constants.STATUS_DIR, statusFile);
  return exists(statusFilePath);
}

export function deleteStatusFile(statusFile: string): Promise<void> {
  if (!/^[\w-]+$/.test(statusFile)) {
    throw new Error("Invalid status file characters");
  }

  const statusFilePath = join(constants.STATUS_DIR, statusFile);
  return Deno.remove(statusFilePath);
}

export function readAppRegistry(): Promise<App[]> {
  const appRegistryFile = join(constants.APPS_DIR, "registry.json");
  return readJsonFile<App[]>(appRegistryFile);
}

export function readVirtualApps(): Promise<Record<string, string[]>> {
  const appRegistryFile = join(constants.APPS_DIR, "virtual-apps.json");
  return readJsonFile<Record<string, string[]>>(appRegistryFile);
}

export function readHiddenService(id: string): Promise<string> {
  if (!/^[\w-]+$/.test(id)) {
    throw new Error("Invalid hidden service ID");
  }

  const hiddenServiceFile = join(
    constants.TOR_HIDDEN_SERVICE_DIR,
    id,
    "hostname",
  );
  return Deno.readTextFile(hiddenServiceFile);
}

export function readTextStatusFile(resource: string): Promise<string> {
  const statusFilePath = join(constants.STATUS_DIR, resource);
  return Deno.readTextFile(statusFilePath);
}

export async function readJsonStatusFile<FileType = unknown>(
  resource: string,
): Promise<FileType> {
  const statusFilePath = join(
    constants.STATUS_DIR,
    `${resource}-status.json`,
  );
  return (await readJsonFile(statusFilePath).catch(() => null)) as FileType;
}

export async function writeJsonStatusFile(
  resource: string,
  data: unknown,
): Promise<void | NodeJS.ErrnoException> {
  const statusFilePath = join(
    constants.STATUS_DIR,
    `${resource}-status.json`,
  );
  await ensureFile(statusFilePath);
  return writeJsonFile(statusFilePath, data);
}
