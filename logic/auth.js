const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const {CipherSeed} = require('aezeed');
const iocane = require('iocane');
const diskLogic = require('logic/disk.js');
const lndApiService = require('services/lndApi.js');
const bashService = require('services/bash.js');
const NodeError = require('models/errors.js').NodeError;
const JWTHelper = require('utils/jwt.js');
const constants = require('utils/const.js');
const UUID = require('utils/UUID.js');

const saltRounds = 10;
const SYSTEM_USER = UUID.fetchBootUUID() || 'admin';

let devicePassword = '';
let changePasswordStatus;

resetChangePasswordStatus();

function resetChangePasswordStatus() {
    changePasswordStatus = {percent: 0};
}

async function sleepSeconds(seconds) {
    return new Promise(resolve => {
        setTimeout(resolve, seconds * constants.TIME.ONE_SECOND_IN_MILLIS);
    });
}

// Caches the password.
function cachePassword(password) {
    devicePassword = password;
}

// Gets the cached the password.
function getCachedPassword() {
    return devicePassword;
}

// Sets system password
const setSystemPassword = async password => {
    await diskLogic.writeStatusFile('password', password);
    await diskLogic.writeSignalFile('change-password');
};

// Change the dashboard and system password.
async function changePassword(currentPassword, newPassword, jwt) {
    resetChangePasswordStatus();
    changePasswordStatus.percent = 1; // eslint-disable-line no-magic-numbers

    try {
    // Update user file
        const user = await diskLogic.readUserFile();
        const credentials = hashCredentials(SYSTEM_USER, newPassword);

        // Re-encrypt seed with new password
        const decryptedSeed = await iocane.createSession().decrypt(user.seed, currentPassword);
        const encryptedSeed = await iocane.createSession().encrypt(decryptedSeed, newPassword);

        // Update user file
        await diskLogic.writeUserFile({...user, password: credentials.password, seed: encryptedSeed});

        // Update system password
        await setSystemPassword(newPassword);

        changePasswordStatus.percent = 100;
        complete = true;

        // Cache the password for later use
        cachePassword(newPassword);
    } catch {
        changePasswordStatus.percent = 100;
        changePasswordStatus.error = true;

        throw new Error('Unable to change password');
    }
}

function getChangePasswordStatus() {
    return changePasswordStatus;
}

// Returns an object with the hashed credentials inside.
function hashCredentials(username, password) {
    const hash = bcrypt.hashSync(password, saltRounds);

    return {password: hash, username, plainTextPassword: password};
}

// Returns true if the user is registered otherwise false.
async function isRegistered() {
    try {
        await diskLogic.readUserFile();

        return {registered: true};
    } catch {
        return {registered: false};
    }
}

// Derives the root umbrel seed and persists it to disk to be used for
// determinstically deriving further entropy for any other Umbrel service.
async function deriveUmbrelSeed(user) {
    if (await diskLogic.umbrelSeedFileExists()) {
        return;
    }

    const mnemonic = (await seed(user)).seed.join(' ');
    const {entropy} = CipherSeed.fromMnemonic(mnemonic);
    const umbrelSeed = crypto
        .createHmac('sha256', entropy)
        .update('umbrel-seed')
        .digest('hex');
    return diskLogic.writeUmbrelSeedFile(umbrelSeed);
}

// Sets the LND password to a hardcoded password if it's locked so we can
// auto unlock it in future
async function removeLndPasswordIfLocked(currentPassword, jwt) {
    const lndStatus = await lndApiService.getStatus();

    if (!lndStatus.data.unlocked) {
        console.log('LND is locked on login, attempting to change password...');
        try {
            await lndApiService.changePassword(currentPassword, constants.LND_WALLET_PASSWORD, jwt);
            console.log('Sucessfully changed LND password!');
        } catch {
            console.log('Failed to change LND password!');
        }
    }
}

// Log the user into the device. Caches the password if login is successful. Then returns jwt.
async function login(user) {
    try {
        const jwt = await JWTHelper.generateJWT(user.username);

        // Cache plain text password
        // cachePassword(user.plainTextPassword);
        cachePassword(user.password);

        deriveUmbrelSeed(user);

        // This is only needed temporarily to update hardcoded passwords
        // on existing users without requiring them to change their password
        setSystemPassword(user.password);

        // This is only needed temporarily to remove the user set LND wallet
        // password for old users and change it to a hardcoded one so we can
        // auto unlock it in the future.
        removeLndPasswordIfLocked(user.password, jwt);

        return {jwt};
    } catch {
        throw new NodeError('Unable to generate JWT');
    }
}

async function getInfo() {
    try {
        const user = await diskLogic.readUserFile();

        // Remove sensitive info
        delete user.password;
        delete user.seed;

        return user;
    } catch {
        throw new NodeError('Unable to get account info');
    }
}

async function seed(user) {
    // Decrypt mnemonic seed
    try {
        const {seed} = await diskLogic.readUserFile();

        const decryptedSeed = await iocane.createSession().decrypt(seed, user.plainTextPassword);

        return {seed: decryptedSeed.split(',')};
    } catch {
        throw new NodeError('Unable to decrypt mnemonic seed');
    }
}

// Registers the the user to the device. Returns an error if a user already exists.
async function register(user, seed) {
    if ((await isRegistered()).registered) {
        throw new NodeError('User already exists', 400); // eslint-disable-line no-magic-numbers
    }

    // Encrypt mnemonic seed for storage
    let encryptedSeed;
    try {
        encryptedSeed = await iocane.createSession().encrypt(seed.join(), user.plainTextPassword);
    } catch {
        throw new NodeError('Unable to encrypt mnemonic seed');
    }

    // Save user
    try {
        await diskLogic.writeUserFile({name: user.name, password: user.password, seed: encryptedSeed});
    } catch {
        throw new NodeError('Unable to register user');
    }

    // Update system password
    try {
        await setSystemPassword(user.plainTextPassword);
    } catch {
        throw new NodeError('Unable to set system password');
    }

    // Derive Umbrel seed
    try {
        await deriveUmbrelSeed(user);
    } catch {
        throw new NodeError('Unable to create Umbrel seed');
    }

    // Generate JWt
    let jwt;
    try {
        jwt = await JWTHelper.generateJWT(user.username);
    } catch {
        await diskLogic.deleteUserFile();
        throw new NodeError('Unable to generate JWT');
    }

    // Initialize lnd wallet
    try {
        await lndApiService.initializeWallet(constants.LND_WALLET_PASSWORD, seed, jwt);
    } catch (error) {
        await diskLogic.deleteUserFile();
        throw new NodeError(error.response.data);
    }

    // Return token
    return {jwt};
}

// Generate and return a new jwt token.
async function refresh(user) {
    try {
        const jwt = await JWTHelper.generateJWT(user.username);

        return {jwt};
    } catch {
        throw new NodeError('Unable to generate JWT');
    }
}

module.exports = {
    changePassword,
    getCachedPassword,
    getChangePasswordStatus,
    hashCredentials,
    isRegistered,
    getInfo,
    seed,
    login,
    register,
    refresh
};
