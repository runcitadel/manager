import * as path from "path";
import { app } from "./apps.js";

import constants from "../utils/const.js";
import * as diskService from "../services/disk.js";
import * as fs from "fs/promises";
import { fs_utils } from "@runcitadel/utils";
import type {
  user as userFile,
  backupStatus,
  updateStatus,
  versionFile,
  debugStatus,
} from "@runcitadel/utils";

export async function deleteUserFile(): Promise<void> {
  return await fs.unlink(constants.USER_FILE);
}

export async function deleteItemsInDir(directory: string): Promise<void> {
  return await diskService.deleteItemsInDir(directory);
}

export async function deleteFoldersInDir(directory: string): Promise<void> {
  await diskService.deleteFoldersInDir(directory);
}

export async function fileExists(path: string): Promise<boolean> {
  return fs_utils
    .readJsonFile(path)
    .then(() => Promise.resolve(true))
    .catch(() => Promise.resolve(false));
}

export async function moveFoldersToDir(
  fromDir: string,
  toDir: string
): Promise<void> {
  await diskService.moveFoldersToDir(fromDir, toDir);
}

export async function readUserFile(): Promise<userFile> {
  const defaultProperties: userFile = {
    name: "",
    password: "",
    seed: "",
    installedApps: [],
  };
  const userFile: userFile = <userFile>(
    await fs_utils.readJsonFile(constants.USER_FILE)
  );
  return { ...defaultProperties, ...userFile };
}

export async function writeUserFile(json: userFile): Promise<void> {
  return fs_utils.writeJsonFile(constants.USER_FILE, json);
}

export async function writeSeedFile(
  seed: string
): Promise<void | NodeJS.ErrnoException> {
  return diskService.ensureWriteFile(constants.SEED_FILE, seed);
}

export async function seedFileExists(): Promise<boolean> {
  return fs
    .readFile(constants.SEED_FILE)
    .then(() => Promise.resolve(true))
    .catch(() => Promise.resolve(false));
}

export function hiddenServiceFileExists(): Promise<boolean> {
  return fs_utils
    .readUtf8File(constants.DASHBOARD_HIDDEN_SERVICE_FILE)
    .then(() => Promise.resolve(true))
    .catch(() => Promise.resolve(false));
}

export function readElectrumHiddenService(): Promise<string> {
  return fs_utils.readUtf8File(constants.ELECTRUM_HIDDEN_SERVICE_FILE);
}

export function readBitcoinP2PHiddenService(): Promise<string> {
  return fs_utils.readUtf8File(constants.BITCOIN_P2P_HIDDEN_SERVICE_FILE);
}

export function readBitcoinRPCHiddenService(): Promise<string> {
  return fs_utils.readUtf8File(constants.BITCOIN_RPC_HIDDEN_SERVICE_FILE);
}

export function readLndRestHiddenService(): Promise<string> {
  return fs_utils.readUtf8File(constants.LND_REST_HIDDEN_SERVICE_FILE);
}

export function readLndGrpcHiddenService(): Promise<string> {
  return fs_utils.readUtf8File(constants.LND_GRPC_HIDDEN_SERVICE_FILE);
}

export function readLndCert(): Promise<string> {
  return fs_utils.readUtf8File(constants.LND_CERT_FILE);
}

export function readLndAdminMacaroon(): Promise<Buffer> {
  return fs.readFile(constants.LND_ADMIN_MACAROON_FILE);
}

export async function readVersionFile(): Promise<versionFile> {
  return (await fs_utils.readJsonFile(constants.VERSION_FILE)) as versionFile;
}

export async function readUpdateStatusFile(): Promise<updateStatus> {
  return (await readStatusFile("update-status.json")) as updateStatus;
}

export async function writeUpdateStatusFile(json: updateStatus): Promise<void> {
  return await writeStatusFile("update-status.json", JSON.stringify(json));
}

export async function updateSignalFileExists(): Promise<boolean> {
  try {
    statusFileExists("update-status.json");
    return true;
  } catch {
    return false;
  }
}

export function updateLockFileExists(): Promise<boolean> {
  return writeStatusFile("update-in-progress", "")
    .then(() => Promise.resolve(true))
    .catch(() => Promise.resolve(false));
}

export async function writeUpdateSignalFile(): Promise<void> {
  await writeSignalFile("update");
}

export async function readBackupStatusFile(): Promise<backupStatus> {
  return (await readStatusFile("backup-status.json")) as backupStatus;
}

export function readJWTPrivateKeyFile(): Promise<string> {
  return fs_utils.readUtf8File(constants.JWT_PRIVATE_KEY_FILE);
}

export function readJWTPublicKeyFile(): Promise<string> {
  return fs_utils.readUtf8File(constants.JWT_PUBLIC_KEY_FILE);
}

export function writeJWTPrivateKeyFile(data: string): Promise<void> {
  return fs_utils.safeWriteFile(constants.JWT_PRIVATE_KEY_FILE, data);
}

export function writeJWTPublicKeyFile(data: string): Promise<void> {
  return fs_utils.safeWriteFile(constants.JWT_PUBLIC_KEY_FILE, data);
}

export async function shutdown(): Promise<void> {
  await writeSignalFile("shutdown");
}

export async function reboot(): Promise<void> {
  await writeSignalFile("reboot");
}

// Read the contends of a file.
export async function readUtf8File(path: string): Promise<string> {
  return await fs_utils.readUtf8File(path);
}

// Read the contents of a file and return a json object.
export async function readJsonFile(path: string): Promise<unknown> {
  return await fs_utils.readJsonFile(path);
}

export async function readDebugStatusFile(): Promise<debugStatus> {
  return (await readStatusFile("debug-status.json")) as debugStatus;
}

export function writeSignalFile(signalFile: string): Promise<void> {
  if (!/^[0-9a-zA-Z-_]+$/.test(signalFile)) {
    throw new Error("Invalid signal file characters");
  }

  const signalFilePath = path.join(constants.SIGNAL_DIR, signalFile);
  return fs_utils.safeWriteFile(signalFilePath, "true");
}

export function writeStatusFile(
  statusFile: string,
  contents: string
): Promise<void> {
  if (!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
    throw new Error("Invalid signal file characters");
  }

  const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
  return fs_utils.safeWriteFile(statusFilePath, contents);
}

export async function readStatusFile(statusFile: string): Promise<unknown> {
  if (!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
    throw new Error("Invalid signal file characters");
  }

  const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
  return await fs_utils.readJsonFile(statusFilePath);
}

export function statusFileExists(statusFile: string): Promise<boolean> {
  if (!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
    throw new Error("Invalid signal file characters");
  }

  const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
  return fs_utils
    .readUtf8File(statusFilePath)
    .then(() => Promise.resolve(true))
    .catch(() => Promise.resolve(false));
}

export async function deleteStatusFile(statusFile: string): Promise<void> {
  if (!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
    throw new Error("Invalid signal file characters");
  }

  const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
  return await fs.unlink(statusFilePath);
}

export async function readAppRegistry(): Promise<app[]> {
  const appRegistryFile = path.join(constants.APPS_DIR, "registry.json");
  return <app[]>await fs_utils.readJsonFile(appRegistryFile);
}

export function readHiddenService(id: string): Promise<string> {
  if (!/^[0-9a-zA-Z-_]+$/.test(id)) {
    throw new Error("Invalid hidden service ID");
  }
  const hiddenServiceFile = path.join(
    constants.TOR_HIDDEN_SERVICE_DIR,
    id,
    "hostname"
  );
  return fs_utils.readUtf8File(hiddenServiceFile);
}

export function memoryWarningStatusFileExists(): Promise<boolean> {
  return statusFileExists("memory-warning");
}

export function deleteMemoryWarningStatusFile(): Promise<void | NodeJS.ErrnoException> {
  return deleteStatusFile("memory-warning");
}
