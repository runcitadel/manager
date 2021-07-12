import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import {CipherSeed} from 'aezeed';
import * as iocane from 'iocane';
import * as diskLogic from './disk.js';
import * as lndApiService from '../services/lndApi.js';
import { NodeError } from '@runcitadel/utils';
import {generateJWT} from '../utils/jwt.js';

const saltRounds = 10;

export type userInfo = {
    username?: string;
    name: string;
    password?: string;
    plainTextPassword?: string;
    seed?: string | Buffer | ArrayBuffer;
    installedApps?: string[]
}

let devicePassword = '';
let changePasswordStatus : {
    percent: number;
    error?: boolean;
};

resetChangePasswordStatus();

export function resetChangePasswordStatus() {
    changePasswordStatus = {percent: 0};
}

// Caches the password.
export function cachePassword(password: string) {
    devicePassword = password;
}

// Gets the cached the password.
export function getCachedPassword() {
    return devicePassword;
}

// Sets system password
const setSystemPassword = async (password: string) => {
    await diskLogic.writeStatusFile('password', password);
    await diskLogic.writeSignalFile('change-password');
};

// Change the dashboard and system password.
export async function changePassword(currentPassword: string, newPassword: string) {
    resetChangePasswordStatus();
    changePasswordStatus.percent = 1; // eslint-disable-line no-magic-numbers

    try {
    // Update user file
        const user = await diskLogic.readUserFile();
        const credentials = hashCredentials(newPassword);

        // Re-encrypt seed with new password
        const decryptedSeed = await iocane.createAdapter().decrypt(<string | Buffer>user.seed, currentPassword);
        const encryptedSeed = await iocane.createAdapter().encrypt(decryptedSeed, newPassword);

        // Update user file
        await diskLogic.writeUserFile({...user, password: credentials.password, seed: encryptedSeed});

        // Update system password
        await setSystemPassword(newPassword);

        changePasswordStatus.percent = 100;

        // Cache the password for later use
        cachePassword(newPassword);
    } catch {
        changePasswordStatus.percent = 100;
        changePasswordStatus.error = true;

        throw new Error('Unable to change password');
    }
}

export function getChangePasswordStatus() {
    return changePasswordStatus;
}

// Returns an object with the hashed credentials inside.
export function hashCredentials(password: string) {
    const hash = bcrypt.hashSync(password, saltRounds);

    return {password: hash, plainTextPassword: password};
}

// Returns true if the user is registered otherwise false.
export async function isRegistered() {
    try {
        await diskLogic.readUserFile();

        return {registered: true};
    } catch {
        return {registered: false};
    }
}

// Derives the root seed and persists it to disk to be used for
// determinstically deriving further entropy for any other service.
export async function deriveSeed(user: userInfo) {
    if (await diskLogic.seedFileExists()) {
        return;
    }

    const mnemonic = (await seed(user)).seed.join(' ');
    const {entropy} = CipherSeed.fromMnemonic(mnemonic);
    const generatedSeed = crypto
        .createHmac('sha256', entropy)
        .update('umbrel-seed')
        .digest('hex');
    return diskLogic.writeSeedFile(generatedSeed);
}

// Log the user into the device. Caches the password if login is successful. Then returns jwt.
export async function login(user: userInfo) {
    try {
        const jwt = await generateJWT(<string>user.username);

        cachePassword(<string>user.password);

        deriveSeed(user);

        // This is only needed temporarily to update hardcoded passwords
        // on existing users without requiring them to change their password
        setSystemPassword(<string>user.password);

        return {jwt};
    } catch {
        throw new NodeError('Unable to generate JWT');
    }
}

export async function getInfo() {
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

export async function seed(user: userInfo) {
    // Decrypt mnemonic seed
    try {
        const {seed} = await diskLogic.readUserFile();

        const decryptedSeed = await iocane.createAdapter().decrypt(<string>seed, <string>user.plainTextPassword) as string;

        return {seed: decryptedSeed.split(',')};
    } catch {
        throw new NodeError('Unable to decrypt mnemonic seed');
    }
}

// Registers the the user to the device. Returns an error if a user already exists.
export async function register(user: userInfo, seed: string[]) {
    if ((await isRegistered()).registered) {
        throw new NodeError('User already exists', 400); // eslint-disable-line no-magic-numbers
    }

    // Encrypt mnemonic seed for storage
    let encryptedSeed;
    try {
        encryptedSeed = await iocane.createAdapter().encrypt(seed.join(), <string>user.plainTextPassword);
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
        await setSystemPassword(<string>user.plainTextPassword);
    } catch {
        throw new NodeError('Unable to set system password');
    }

    // Derive seed
    try {
        await deriveSeed(user);
    } catch {
        throw new NodeError('Unable to create seed');
    }

    // Generate JWt
    let jwt;
    try {
        jwt = await generateJWT(<string>user.username);
    } catch {
        await diskLogic.deleteUserFile();
        throw new NodeError('Unable to generate JWT');
    }

    // Initialize lnd wallet
    try {
        await lndApiService.initializeWallet(seed, jwt);
    } catch (error) {
        await diskLogic.deleteUserFile();
        throw new NodeError(error.response.data);
    }

    // Return token
    return {jwt};
}

// Generate and return a new jwt token.
export async function refresh(user: userInfo) {
    try {
        const jwt = await generateJWT(<string>user.username);

        return {jwt};
    } catch {
        throw new NodeError('Unable to generate JWT');
    }
}
