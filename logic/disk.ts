import * as path from 'path';
import { app } from './apps.js';

import constants from '../utils/const.js';
import * as diskService from '../services/disk.js';
import * as fs from 'fs/promises';
import {fs_utils} from '@runcitadel/utils';

export type userFile = {
    name: string,
    password?: string,
    plainTextPassword?: string,
    seed?: string | Buffer | ArrayBuffer,
    installedApps?: string[]
}

export type updateStatus = {
    updateTo?: string;
    version: string;
}

export async function deleteUserFile() {
    return await fs.unlink(constants.USER_FILE);
}

export async function deleteItemsInDir(directory: string) {
    return await diskService.deleteItemsInDir(directory);
}

export async function deleteFoldersInDir(directory: string) {
    await diskService.deleteFoldersInDir(directory);
}

export async function fileExists(path: string) {
    return fs_utils.readJsonFile(path)
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

export async function moveFoldersToDir(fromDir: string, toDir: string) {
    await diskService.moveFoldersToDir(fromDir, toDir);
}

export async function readUserFile(): Promise<userFile> {
    const defaultProperties: userFile = {
        name: "",
        password: "",
        seed: "",
        installedApps: [],
    };
    const userFile: userFile = <userFile>await fs_utils.readJsonFile(constants.USER_FILE);
    return {...defaultProperties, ...userFile};
}

export async function writeUserFile(json: userFile) {
    return fs_utils.writeJsonFile(constants.USER_FILE, json);
}

export async function writeUmbrelSeedFile(umbrelSeed: string) {
    return diskService.ensureWriteFile(constants.UMBREL_SEED_FILE, umbrelSeed);
}

export async function umbrelSeedFileExists() {
    return fs.readFile(constants.UMBREL_SEED_FILE)
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

export function hiddenServiceFileExists() {
    return fs_utils.readUtf8File(constants.UMBREL_DASHBOARD_HIDDEN_SERVICE_FILE)
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

export function readElectrumHiddenService() {
    return fs_utils.readUtf8File(constants.ELECTRUM_HIDDEN_SERVICE_FILE);
}

export function readBitcoinP2PHiddenService() {
    return fs_utils.readUtf8File(constants.BITCOIN_P2P_HIDDEN_SERVICE_FILE);
}

export function readBitcoinRPCHiddenService() {
    return fs_utils.readUtf8File(constants.BITCOIN_RPC_HIDDEN_SERVICE_FILE);
}

export function readLndRestHiddenService() {
    return fs_utils.readUtf8File(constants.LND_REST_HIDDEN_SERVICE_FILE);
}

export function readLndGrpcHiddenService() {
    return fs_utils.readUtf8File(constants.LND_GRPC_HIDDEN_SERVICE_FILE);
}

export function readLndCert() {
    return fs_utils.readUtf8File(constants.LND_CERT_FILE);
}

export function readLndAdminMacaroon() {
    return fs.readFile(constants.LND_ADMIN_MACAROON_FILE);
}

export function readUmbrelVersionFile() {
    return fs_utils.readJsonFile(constants.UMBREL_VERSION_FILE);
}

export async function readUpdateStatusFile() {
    return await readStatusFile("update-status.json");
}

export async function writeUpdateStatusFile(json: updateStatus) {
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

export function updateLockFileExists() {
    return writeStatusFile("update-in-progress", "")
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

export async function writeUpdateSignalFile() {
    await writeSignalFile("update");
}

export async function readBackupStatusFile() {
    return await readStatusFile("backup-status.json");
}

export function readJWTPrivateKeyFile() {
    return fs_utils.readUtf8File(constants.JWT_PRIVATE_KEY_FILE);
}

export function readJWTPublicKeyFile() {
    return fs_utils.readUtf8File(constants.JWT_PUBLIC_KEY_FILE);
}

export function writeJWTPrivateKeyFile(data: string) {
    return fs_utils.safeWriteFile(constants.JWT_PRIVATE_KEY_FILE, data);
}

export function writeJWTPublicKeyFile(data: string) {
    return fs_utils.safeWriteFile(constants.JWT_PUBLIC_KEY_FILE, data);
}

export async function shutdown() {
    await writeSignalFile("shutdown");
}

export async function reboot() {
    await writeSignalFile("reboot");
}

// Read the contends of a file.
export async function readUtf8File(path: string) {
    return await fs_utils.readUtf8File(path);
}

// Read the contents of a file and return a json object.
export async function readJsonFile(path: string) {
    return await fs_utils.readJsonFile(path);
}

export async function readDebugStatusFile() {
    return await readStatusFile("update-status.json");
}

export function writeSignalFile(signalFile: string) {
    if(!/^[0-9a-zA-Z-_]+$/.test(signalFile)) {
        throw new Error('Invalid signal file characters');
    }

    const signalFilePath = path.join(constants.SIGNAL_DIR, signalFile);
    return fs_utils.safeWriteFile(signalFilePath, 'true');
}

export function writeStatusFile(statusFile: string, contents: string) {
    if(!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
        throw new Error('Invalid signal file characters');
    }

    const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
    return fs_utils.safeWriteFile(statusFilePath, contents);
}

export async function readStatusFile(statusFile: string) {
    if(!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
        throw new Error('Invalid signal file characters');
    }

    const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
    return await fs_utils.readJsonFile(statusFilePath);
}

export function statusFileExists(statusFile: string): Promise<boolean> {
    if(!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
        throw new Error('Invalid signal file characters');
    }

    const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
    return fs_utils.readUtf8File(statusFilePath)
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

export function deleteStatusFile(statusFile: string) {
    if(!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
        throw new Error('Invalid signal file characters');
    }

    const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
    return fs.unlink(statusFilePath);
}

export async function readAppRegistry(): Promise<app[]> {
    const appRegistryFile = path.join(constants.APPS_DIR, 'registry.json');
    return <app[]>await fs_utils.readJsonFile(appRegistryFile);
}

export function readHiddenService(id: string) {
    if(!/^[0-9a-zA-Z-_]+$/.test(id)) {
        throw new Error('Invalid hidden service ID');
    }
    const hiddenServiceFile = path.join(constants.TOR_HIDDEN_SERVICE_DIR, id, 'hostname');
    return fs_utils.readUtf8File(hiddenServiceFile);
}

export function memoryWarningStatusFileExists(): Promise<boolean> {
    return statusFileExists('memory-warning');
}

export function deleteMemoryWarningStatusFile(): Promise<void | NodeJS.ErrnoException> {
    return deleteStatusFile('memory-warning');
}
