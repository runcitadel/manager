import * as crypto from "https://deno.land/std@0.153.0/node/crypto.ts";
import { Buffer } from "https://deno.land/std@0.153.0/node/buffer.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.0/mod.ts";
import { CipherSeed } from "https://esm.sh/aezeed@0.0.5";
import iocane from "https://esm.sh/iocane@5.1.1/web";
import { encode } from "https://deno.land/std@0.153.0/encoding/base32.ts";
import * as lightningApiService from "../services/lightning-api.ts";
import { generateJwt } from "../utils/jwt.ts";
import { runCommand } from "../services/karen.ts";
import * as diskLogic from "./disk.ts";

export function generateRandomKey(): string {
  return crypto.randomBytes(10).toString("hex");
}

export function encodeKey(key: string) {
  return encode(new TextEncoder().encode(key));
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

let changePasswordStatus: ChangePasswordStatusType = { percent: 0 };

resetChangePasswordStatus();

export function resetChangePasswordStatus(): void {
  changePasswordStatus = { percent: 0 };
}

// Sets system password
const setSystemPassword = async (password: string) => {
  await diskLogic.writeStatusFile("password", password);
  await runCommand(`trigger change-password`);
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
    const encryptedPassword = await hashPassword(newPassword);

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
      password: encryptedPassword,
      seed: encryptedSeed,
    });

    // Update system password
    await setSystemPassword(newPassword);

    changePasswordStatus.percent = 100;
  } catch {
    changePasswordStatus.percent = 100;
    changePasswordStatus.error = true;

    throw new Error("Unable to change password");
  }
}

export function getChangePasswordStatus(): ChangePasswordStatusType {
  return changePasswordStatus;
}

// Returns an object with the hashed credentials inside.
export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password);
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
  plainTextPassword: string,
): Promise<void | NodeJS.ErrnoException> {
  if (diskLogic.seedFileExists()) {
    return;
  }

  const userSeed = await seed(plainTextPassword);
  const mnemonic = userSeed.join(" ");
  const { entropy } = CipherSeed.fromMnemonic(mnemonic);
  const generatedSeed = crypto
    .createHmac("sha256", entropy)
    .update("umbrel-seed")
    .digest("hex");
  return diskLogic.writeSeedFile(generatedSeed);
}

// Derives the root seed and persists it to disk to be used for
// determinstically deriving further entropy for any other service.
export function deriveCitadelSeed(
  mnemonic: string[],
): void | Promise<void> {
  if (diskLogic.seedFileExists()) {
    return;
  }

  const { entropy } = CipherSeed.fromMnemonic(mnemonic.join(" "));
  const generatedSeed = crypto
    .createHmac("sha256", entropy)
    .update("umbrel-seed")
    .digest("hex");
  return diskLogic.writeSeedFile(generatedSeed);
}

// Log the user into the device. Caches the password if login is successful. Then returns jwt.
export async function login(plainTextPassword: string): Promise<string> {
  try {
    const jwt = await generateJwt("admin");

    await deriveSeed(plainTextPassword);

    await setSystemPassword(plainTextPassword);

    return jwt;
  } catch {
    throw new Error("Unable to generate JWT");
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
    throw new Error("Unable to get account info");
  }
}

export async function seed(plainTextPassword: string): Promise<string[]> {
  // Decrypt mnemonic seed
  try {
    const { seed } = await diskLogic.readUserFile();

    const decryptedSeed = (await iocane
      .createAdapter()
      .decrypt(seed as string, plainTextPassword!)) as string;

    return decryptedSeed.split(",");
  } catch {
    throw new Error("Unable to decrypt mnemonic seed");
  }
}

// Registers the the user to the device. Returns an error if a user already exists.
export async function register(
  name: string,
  plainTextPassword: string,
  seed: string[],
): Promise<string> {
  if (await isRegistered()) {
    throw new Error("User already exists");
  }

  // Encrypt mnemonic seed for storage
  let encryptedSeed;
  try {
    encryptedSeed = await iocane
      .createAdapter()
      .encrypt(seed.join(","), plainTextPassword);
  } catch {
    throw new Error("Unable to encrypt mnemonic seed");
  }

  // Save user
  try {
    const hashedPassword = await hashPassword(plainTextPassword);
    await diskLogic.writeUserFile({
      name: name,
      password: hashedPassword,
      seed: encryptedSeed,
    });
  } catch {
    throw new Error("Unable to register user");
  }

  // Update system password
  try {
    await setSystemPassword(plainTextPassword);
  } catch {
    throw new Error("Unable to set system password");
  }

  // Derive seed
  try {
    await deriveCitadelSeed(seed);
  } catch (error: unknown) {
    console.error(error);
    throw new Error("Unable to create seed");
  }

  // Generate JWt
  let jwt;
  try {
    jwt = await generateJwt("admin");
  } catch {
    await diskLogic.deleteUserFile();
    throw new Error("Unable to generate JWT");
  }

  // Initialize lnd wallet
  try {
    await lightningApiService.initializeWallet(seed, jwt);
  } catch (error: unknown) {
    await diskLogic.deleteUserFile();
    throw new Error((error as { response: { data: string } }).response.data);
  }

  await runCommand("trigger app-update");
  // Return token
  return jwt;
}

// Generate and return a new jwt token.
export async function refresh(): Promise<string> {
  try {
    const jwt = await generateJwt("admin");
    return jwt;
  } catch {
    throw new Error("Unable to generate JWT");
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
