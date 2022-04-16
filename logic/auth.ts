import * as crypto from 'node:crypto';
import {Buffer} from 'node:buffer';
import * as bcrypt from '@node-rs/bcrypt';
import {CipherSeed} from 'aezeed';
import * as iocane from 'iocane';
import base32 from 'thirty-two';
import * as lightningApiService from '../services/lightning-api.js';
import {generateJwt} from '../utils/jwt.js';
import * as diskLogic from './disk.js';
import {migrateAdminLegacyUser} from './user.js';

export function generateRandomKey(): string {
  return crypto.randomBytes(10).toString('hex');
}

export function encodeKey(key: string) {
  return base32.encode(key).toString();
}

export type UserInfo = {
  username?: string;
  name: string;
  password?: string;
  plainTextPassword?: string;
  seed?: string | Buffer | ArrayBuffer;
  installedApps?: string[];
};

type UserSettings = {
  twoFactorAuth: boolean;
  twoFactorKey: string | false;
};

type UserFile = {
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

export type ChangePasswordStatusType = {
  percent: number;
  error?: boolean;
};

const saltRounds = 10;

let changePasswordStatus: ChangePasswordStatusType = {percent: 0};

resetChangePasswordStatus();

export function resetChangePasswordStatus(): void {
  changePasswordStatus = {percent: 0};
}

// Sets system password
const setSystemPassword = async (password: string) => {
  await diskLogic.writeStatusFile('password', password);
  await diskLogic.writeSignalFile('change-password');
};

// Change the dashboard and system password.
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  resetChangePasswordStatus();
  changePasswordStatus.percent = 1;

  try {
    // Update user file
    const user = await diskLogic.readUserFile();
    const credentials = hashCredentials(newPassword);

    // Check if user.seed is of type ArrayBuffer, if so convert it to Buffer
    if (user.seed instanceof ArrayBuffer) {
      user.seed = Buffer.from(user.seed);
    }

    // Re-encrypt seed with new password
    const decryptedSeed = await iocane
      .createAdapter()
      .decrypt(user.seed as string | Buffer, currentPassword);
    const encryptedSeed = await iocane
      .createAdapter()
      .encrypt(decryptedSeed, newPassword);

    // Update user file
    await diskLogic.writeUserFile({
      ...user,
      password: credentials.password,
      seed: encryptedSeed,
    });

    // Update system password
    await setSystemPassword(newPassword);

    changePasswordStatus.percent = 100;
    try {
      const futureUser = await migrateAdminLegacyUser(user.name, newPassword);
      await futureUser.changePassword(newPassword);
    } catch (error: unknown) {
      console.warn(error);
    }
  } catch {
    changePasswordStatus.percent = 100;
    changePasswordStatus.error = true;

    throw new Error('Unable to change password');
  }
}

export function getChangePasswordStatus(): ChangePasswordStatusType {
  return changePasswordStatus;
}

// Returns an object with the hashed credentials inside.
export function hashCredentials(password: string): {
  password: string;
  plainTextPassword: string;
} {
  const hash = bcrypt.hashSync(password, saltRounds);

  return {password: hash, plainTextPassword: password};
}

// Returns true if the user is registered otherwise false.
export async function isRegistered(): Promise<boolean> {
  try {
    await diskLogic.readUserFile();

    return true;
  } catch {
    return false;
  }
}

// Derives the root seed and persists it to disk to be used for
// determinstically deriving further entropy for any other service.
export async function deriveSeed(
  user: UserInfo,
): Promise<void | NodeJS.ErrnoException> {
  if (diskLogic.seedFileExists()) {
    return;
  }

  const userSeed = await seed(user);
  const mnemonic = userSeed.join(' ');
  const {entropy} = CipherSeed.fromMnemonic(mnemonic);
  const generatedSeed = crypto
    .createHmac('sha256', entropy)
    .update('umbrel-seed')
    .digest('hex');
  return diskLogic.writeSeedFile(generatedSeed);
}

// Derives the root seed and persists it to disk to be used for
// determinstically deriving further entropy for any other service.
export async function deriveCitadelSeed(
  mnemonic: string[],
): Promise<void | NodeJS.ErrnoException> {
  if (diskLogic.seedFileExists()) {
    return;
  }

  const {entropy} = CipherSeed.fromMnemonic(mnemonic.join(' '));
  const generatedSeed = crypto
    .createHmac('sha256', entropy)
    .update('umbrel-seed')
    .digest('hex');
  return diskLogic.writeSeedFile(generatedSeed);
}

export async function generateTemporaryJwt(): Promise<string> {
  try {
    return await generateJwt('temporary');
  } catch {
    throw new Error('Unable to generate JWT');
  }
}

// Log the user into the device. Caches the password if login is successful. Then returns jwt.
export async function login(user: UserInfo): Promise<string> {
  try {
    const jwt = await generateJwt(user.username!);

    await deriveSeed(user);

    // This is only needed temporarily to update hardcoded passwords
    // on existing users without requiring them to change their password
    await setSystemPassword(user.password!);

    return jwt;
  } catch {
    throw new Error('Unable to generate JWT');
  }
}

export async function getInfo(): Promise<UserFile> {
  try {
    const user = await diskLogic.readUserFile();

    // Remove sensitive info
    delete user.password;
    delete user.seed;

    return user;
  } catch {
    throw new Error('Unable to get account info');
  }
}

export async function seed(user: UserInfo): Promise<string[]> {
  // Decrypt mnemonic seed
  try {
    let {seed} = await diskLogic.readUserFile();

    if (seed instanceof ArrayBuffer) {
      seed = Buffer.from(seed);
    }

    if (seed instanceof Buffer) {
      seed = seed.toString('utf-8');
    }

    const decryptedSeed = (await iocane
      .createAdapter()
      .decrypt(seed as string, user.plainTextPassword!)) as string;

    return decryptedSeed.split(',');
  } catch {
    throw new Error('Unable to decrypt mnemonic seed');
  }
}

// Registers the the user to the device. Returns an error if a user already exists.
export async function register(
  user: UserInfo,
  seed: string[],
): Promise<string> {
  if (await isRegistered()) {
    throw new Error('User already exists');
  }

  // Encrypt mnemonic seed for storage
  let encryptedSeed;
  try {
    encryptedSeed = await iocane
      .createAdapter()
      .encrypt(seed.join(','), user.plainTextPassword!);
  } catch {
    throw new Error('Unable to encrypt mnemonic seed');
  }

  // Save user
  try {
    await diskLogic.writeUserFile({
      name: user.name,
      password: user.password,
      seed: encryptedSeed,
    });
  } catch {
    throw new Error('Unable to register user');
  }

  // Update system password
  try {
    await setSystemPassword(user.plainTextPassword!);
  } catch {
    throw new Error('Unable to set system password');
  }

  // Derive seed
  try {
    await deriveCitadelSeed(seed);
  } catch (error: unknown) {
    console.error(error);
    throw new Error('Unable to create seed');
  }

  // Generate JWt
  let jwt;
  try {
    jwt = await generateJwt(user.username!);
  } catch {
    await diskLogic.deleteUserFile();
    throw new Error('Unable to generate JWT');
  }

  // Initialize lnd wallet
  try {
    await lightningApiService.initializeWallet(seed, jwt);
  } catch (error: unknown) {
    await diskLogic.deleteUserFile();
    throw new Error((error as {response: {data: string}}).response.data);
  }

  await diskLogic.writeSignalFile('app-update');
  // Return token
  return jwt;
}

// Generate and return a new jwt token.
export async function refresh(user: UserInfo): Promise<string> {
  try {
    const jwt = await generateJwt(user.username!);

    return jwt;
  } catch {
    throw new Error('Unable to generate JWT');
  }
}

export async function enableTotp(key?: string): Promise<string> {
  const newKey = key ? key : generateRandomKey();
  await diskLogic.enable2fa(newKey);
  return newKey;
}

export async function setupTotp(key?: string): Promise<string> {
  const newKey = key ? key : generateRandomKey();
  await diskLogic.setup2fa(newKey);
  return newKey;
}
