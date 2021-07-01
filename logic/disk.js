const path = require('path');

const constants = require('utils/const.js');
const diskService = require('services/disk.js');

async function deleteUserFile() {
    return await diskService.deleteFile(constants.USER_FILE);
}

async function deleteItemsInDir(directory) {
    return await diskService.deleteItemsInDir(directory);
}

async function deleteFoldersInDir(directory) {
    await diskService.deleteFoldersInDir(directory);
}

async function fileExists(path) {
    return diskService.readJsonFile(path)
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

async function getBuildDetails(appsToLaunch) {

    const details = [];

    for (const applicationName of Object.keys(appsToLaunch)) {
        const application = {};
        application.name = applicationName;
        const path = constants.WORKING_DIRECTORY + '/' + application.name + '/'
      + appsToLaunch[application.name].version + '/';
        application.ymlPath = path + application.name + '.yml';
        application.digestsPath = path + 'digests.json';
        details.push(application);
    }

    return details;
}

async function listVersionsForApp(app) {
    return await diskService.listDirsInDir(constants.WORKING_DIRECTORY + '/' + app);
}

async function moveFoldersToDir(fromDir, toDir) {
    await diskService.moveFoldersToDir(fromDir, toDir);
}

async function writeAppVersionFile(application, json) {
    return diskService.writeJsonFile(constants.WORKING_DIRECTORY + '/' + application, json);
}

async function readUserFile() {
    const defaultProperties = {
        name: "",
        password: "",
        seed: "",
        installedApps: [],
    };
    const userFile = await diskService.readJsonFile(constants.USER_FILE);
    return {...defaultProperties, ...userFile};
}

function readSettingsFile() {
    return diskService.readJsonFile(constants.SETTINGS_FILE);
}

function writeSettingsFile(json) {
    return diskService.writeJsonFile(constants.SETTINGS_FILE, json);
}

async function writeUserFile(json) {
    return diskService.writeJsonFile(constants.USER_FILE, json);
}

async function writeUmbrelSeedFile(umbrelSeed) {
    return diskService.ensureWriteFile(constants.UMBREL_SEED_FILE, umbrelSeed);
}

async function umbrelSeedFileExists(umbrelSeed) {
    return diskService.readFile(constants.UMBREL_SEED_FILE)
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

function settingsFileExists() {
    return diskService.readJsonFile(constants.SETTINGS_FILE)
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

function hiddenServiceFileExists() {
    return diskService.readUtf8File(constants.UMBREL_DASHBOARD_HIDDEN_SERVICE_FILE)
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

async function readAppVersionFile(application) {
    return diskService.readJsonFile(constants.WORKING_DIRECTORY + '/' + application);
}

function readElectrumHiddenService() {
    return diskService.readUtf8File(constants.ELECTRUM_HIDDEN_SERVICE_FILE);
}

function readBitcoinP2PHiddenService() {
    return diskService.readUtf8File(constants.BITCOIN_P2P_HIDDEN_SERVICE_FILE);
}

function readBitcoinRPCHiddenService() {
    return diskService.readUtf8File(constants.BITCOIN_RPC_HIDDEN_SERVICE_FILE);
}

function readLndRestHiddenService() {
    return diskService.readUtf8File(constants.LND_REST_HIDDEN_SERVICE_FILE);
}

function readLndGrpcHiddenService() {
    return diskService.readUtf8File(constants.LND_GRPC_HIDDEN_SERVICE_FILE);
}

function readLndCert() {
    return diskService.readUtf8File(constants.LND_CERT_FILE);
}

function readLndAdminMacaroon() {
    return diskService.readFile(constants.LND_ADMIN_MACAROON_FILE);
}

function readUmbrelVersionFile() {
    return diskService.readJsonFile(constants.UMBREL_VERSION_FILE);
}

async function readUpdateStatusFile() {
    return await readStatusFile("update-status.json");
}

async function writeUpdateStatusFile(json) {
    return await writeStatusFile("update-status.json", json);
}

function updateSignalFileExists(version) {
    return diskService.statusFileExists("update-status.json")
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

function updateLockFileExists(version) {
    return writeStatusFile("update-in-progress", "")
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

async function writeUpdateSignalFile() {
    await writeSignalFile("update");
}

async function readBackupStatusFile() {
    return await readStatusFile("backup-status.json");
}

function readJWTPrivateKeyFile() {
    return diskService.readFile(constants.JWT_PRIVATE_KEY_FILE);
}

function readJWTPublicKeyFile() {
    return diskService.readFile(constants.JWT_PUBLIC_KEY_FILE);
}

function writeJWTPrivateKeyFile(data) {
    return diskService.writeKeyFile(constants.JWT_PRIVATE_KEY_FILE, data);
}

function writeJWTPublicKeyFile(data) {
    return diskService.writeKeyFile(constants.JWT_PUBLIC_KEY_FILE, data);
}

async function shutdown() {
    await writeSignalFile("shutdown");
}

async function reboot() {
    await writeSignalFile("reboot");
}

// Read the contends of a file.
async function readUtf8File(path) {
    return await diskService.readUtf8File(path);
}

// Read the contents of a file and return a json object.
async function readJsonFile(path) {
    return await diskService.readJsonFile(path);
}

async function readDebugStatusFile() {
    return await readStatusFile("update-status.json");
}

function writeSignalFile(signalFile) {
    if(!/^[0-9a-zA-Z-_]+$/.test(signalFile)) {
        throw new Error('Invalid signal file characters');
    }

    const signalFilePath = path.join(constants.SIGNAL_DIR, signalFile);
    return diskService.writeFile(signalFilePath, 'true');
}

function writeStatusFile(statusFile, contents) {
    if(!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
        throw new Error('Invalid signal file characters');
    }

    const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
    return diskService.writeFile(statusFilePath, contents);
}

async function readStatusFile(statusFile) {
    if(!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
        throw new Error('Invalid signal file characters');
    }

    const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
    return await diskService.readJsonFile(statusFilePath, contents);
}

function statusFileExists(statusFile) {
    if(!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
        throw new Error('Invalid signal file characters');
    }

    const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
    return diskService.readUtf8File(statusFilePath)
        .then(() => Promise.resolve(true))
        .catch(() => Promise.resolve(false));
}

function deleteStatusFile(statusFile) {
    if(!/^[0-9a-zA-Z-_]+$/.test(statusFile)) {
        throw new Error('Invalid signal file characters');
    }

    const statusFilePath = path.join(constants.STATUS_DIR, statusFile);
    return diskService.deleteFile(statusFilePath);
}

function readAppRegistry() {
    const appRegistryFile = path.join(constants.APPS_DIR, 'registry.json');
    return diskService.readJsonFile(appRegistryFile);
}

function readHiddenService(id) {
    if(!/^[0-9a-zA-Z-_]+$/.test(id)) {
        throw new Error('Invalid hidden service ID');
    }
    const hiddenServiceFile = path.join(constants.TOR_HIDDEN_SERVICE_DIR, id, 'hostname');
    return diskService.readUtf8File(hiddenServiceFile);
}

function memoryWarningStatusFileExists() {
    return statusFileExists('memory-warning');
}

function deleteMemoryWarningStatusFile() {
    return deleteStatusFile('memory-warning');
}

module.exports = {
    deleteItemsInDir,
    deleteUserFile,
    deleteFoldersInDir,
    moveFoldersToDir,
    fileExists,
    getBuildDetails,
    listVersionsForApp,
    readSettingsFile,
    readUserFile,
    writeAppVersionFile,
    writeSettingsFile,
    writeUserFile,
    writeUmbrelSeedFile,
    umbrelSeedFileExists,
    settingsFileExists,
    hiddenServiceFileExists,
    readAppVersionFile,
    readElectrumHiddenService,
    readBitcoinP2PHiddenService,
    readBitcoinRPCHiddenService,
    readLndRestHiddenService,
    readLndGrpcHiddenService,
    readLndCert,
    readLndAdminMacaroon,
    readUmbrelVersionFile,
    readUpdateStatusFile,
    writeUpdateStatusFile,
    writeUpdateSignalFile,
    updateSignalFileExists,
    updateLockFileExists,
    readBackupStatusFile,
    readJWTPrivateKeyFile,
    readJWTPublicKeyFile,
    writeJWTPrivateKeyFile,
    writeJWTPublicKeyFile,
    shutdown,
    reboot,
    readUtf8File,
    readJsonFile,
    readDebugStatusFile,
    writeSignalFile,
    writeStatusFile,
    readStatusFile,
    readAppRegistry,
    readHiddenService,
    memoryWarningStatusFileExists,
    deleteMemoryWarningStatusFile,
};
