const path = require('path');

const constants = require('utils/const.js');
const diskService = require('services/disk.js');

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
    return await diskService.deleteFile(constants.USER_FILE);
}

export async function deleteItemsInDir(directory: string) {
    return await diskService.deleteItemsInDir(directory);
}

export async function deleteFoldersInDir(directory: string) {
    await diskService.deleteFoldersInDir(directory);
}

export async function fileExists(path: string) {
    return diskService.readJsonFile(path)
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
    const userFile: userFile = await diskService.readJsonFile(constants.USER_FILE);
    return {...defaultProperties, ...userFile};
}

export async function writeUserFile(json: userFile) {
    return diskService.writeJsonFile(constants.USER_FILE, json);
}

export async function writeUmbrelSeedFile(umbrelSeed: string) {
    return diskService.ensureWriteFile(constants.UMBREL_SEED_FILE, umbrelSeed);
}

export async function umbrelSeedFileExists() {
    return diskService.readFile(constants.UMBREL_SEED_FILE)
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

export function settingsFileExists() {
    return diskService.readJsonFile(constants.SETTINGS_FILE)
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

export function hiddenServiceFileExists() {
    return diskService.readUtf8File(constants.UMBREL_DASHBOARD_HIDDEN_SERVICE_FILE)
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

export function readElectrumHiddenService() {
    return diskService.readUtf8File(constants.ELECTRUM_HIDDEN_SERVICE_FILE);
}

export function readBitcoinP2PHiddenService() {
    return diskService.readUtf8File(constants.BITCOIN_P2P_HIDDEN_SERVICE_FILE);
}

export function readBitcoinRPCHiddenService() {
    return diskService.readUtf8File(constants.BITCOIN_RPC_HIDDEN_SERVICE_FILE);
}

export function readLndRestHiddenService() {
    return diskService.readUtf8File(constants.LND_REST_HIDDEN_SERVICE_FILE);
}

export function readLndGrpcHiddenService() {
    return diskService.readUtf8File(constants.LND_GRPC_HIDDEN_SERVICE_FILE);
}

export function readLndCert() {
    return diskService.readUtf8File(constants.LND_CERT_FILE);
}

export function readLndAdminMacaroon() {
    return diskService.readFile(constants.LND_ADMIN_MACAROON_FILE);
}

export function readUmbrelVersionFile() {
    return diskService.readJsonFile(constants.UMBREL_VERSION_FILE);
}

export async function readUpdateStatusFile() {
    return await readStatusFile("update-status.json");
}

export async function writeUpdateStatusFile(json: updateStatus) {
    return await writeStatusFile("update-status.json", JSON.stringify(json));
}

export function updateSignalFileExists(): boolean {
    return diskService.statusFileExists("update-status.json")
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
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
    return diskService.readFile(constants.JWT_PRIVATE_KEY_FILE);
}

export function readJWTPublicKeyFile() {
    return diskService.readFile(constants.JWT_PUBLIC_KEY_FILE);
}

export function writeJWTPrivateKeyFile(data: string | NodeJS.ArrayBufferView) {
    return diskService.writeKeyFile(constants.JWT_PRIVATE_KEY_FILE, data);
}

export function writeJWTPublicKeyFile(data: string | NodeJS.ArrayBufferView) {
    return diskService.writeKeyFile(constants.JWT_PUBLIC_KEY_FILE, data);
}

export async function shutdown() {
    await writeSignalFile("shutdown");
}

export async function reboot() {
    await writeSignalFile("reboot");
}

// Read the contends of a file.
export async function readUtf8File(path: string) {
    return await diskService.readUtf8File(path);
}

// Read the contents of a file and return a json object.
export async function readJsonFile(path: string) {
    return await diskService.readJsonFile(path);
}

export async function readDebugStatusFile() {
    return await readStatusFile("update-status.json");
}

export function writeSignalFile(signalFile: string) {
    if(!/^[0-9a-zA-Z-_]+$/.test(signalFile)) {
        throw new Error('Invalid signal file characters');
    }

    const signalFilePath = path.join(constants.SIGNAL_DIR, signalFile);
    return diskService.writeFile(signalFilePath, 'true');
}

export function writeStatusFile(statusFile: string, contents: string) {
    if(!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
        throw new Error('Invalid signal file characters');
    }

    const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
    return diskService.writeFile(statusFilePath, contents);
}

export async function readStatusFile(statusFile: string) {
    if(!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
        throw new Error('Invalid signal file characters');
    }

    const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
    return await diskService.readJsonFile(statusFilePath);
}

export function statusFileExists(statusFile: string) {
    if(!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
        throw new Error('Invalid signal file characters');
    }

    const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
    return diskService.readUtf8File(statusFilePath)
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

export function deleteStatusFile(statusFile: string) {
    if(!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
        throw new Error('Invalid signal file characters');
    }

    const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
    return diskService.deleteFile(statusFilePath);
}

export function readAppRegistry() {
    const appRegistryFile = path.join(constants.APPS_DIR, 'registry.json');
    return diskService.readJsonFile(appRegistryFile);
}

export function readHiddenService(id: string) {
    if(!/^[0-9a-zA-Z-_]+$/.test(id)) {
        throw new Error('Invalid hidden service ID');
    }
    const hiddenServiceFile = path.join(constants.TOR_HIDDEN_SERVICE_DIR, id, 'hostname');
    return diskService.readUtf8File(hiddenServiceFile);
}

export function memoryWarningStatusFileExists() {
    return statusFileExists('memory-warning');
}

export function deleteMemoryWarningStatusFile() {
    return deleteStatusFile('memory-warning');
}
