import { isValidJwt } from "../utils/jwt.ts";
import * as diskLogic from "../logic/disk.ts";
import { isString } from "../utils/types.ts";
import { TOTP } from "https://deno.land/x/god_crypto@v1.4.10/otp.ts";

import Rsa from "npm:node-rsa";
import { Middleware, Status } from "https://deno.land/x/oak@v11.1.0/mod.ts";

import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.0/mod.ts";

export function genKeys(): {
  privateKey: string;
  publicKey: string;
} {
  const key = new Rsa({ b: 4096 });

  const privateKey = key.exportKey("private");
  const publicKey = key.exportKey("public");

  return {
    privateKey,
    publicKey,
  }
}

export async function generateJwtKeys(): Promise<void> {
  const { privateKey, publicKey } = genKeys();

  await diskLogic.writeJwtPrivateKeyFile(privateKey);
  await diskLogic.writeJwtPublicKeyFile(publicKey);
}

try {
  await diskLogic.readJwtPublicKeyFile();
} catch {
  await generateJwtKeys();
}

export const basic: Middleware = async (
  ctx,
  next,
): Promise<void> => {
  let reqPassword = ctx.request.headers.get("Authorization")?.split(" ")[1];
  // deno-lint-ignore no-explicit-any
  let body: any;
  try {
    body = await ctx.request.body({
      type: "json",
    }).value;
    reqPassword = body.password || reqPassword;
  } catch {
    // Allow failure
  }
  if (!reqPassword) {
    ctx.throw(Status.BadRequest, "Missing authorization header");
  }
  isString(reqPassword, ctx);
  let userInfo: diskLogic.UserFile;
  try {
    userInfo = await diskLogic.readUserFile();
  } catch {
    ctx.throw(Status.Unauthorized, "No user registered");
    throw new TypeError(
      "This error should not be visible, but is required to get TypeScript to shut up",
    );
  }

  const storedPassword = userInfo.password;
  if (!storedPassword) {
    ctx.throw(Status.InternalServerError, "No password stored");
  }

  const equal = await bcrypt.compare(
    reqPassword as string,
    storedPassword as string,
  );
  if (!equal) {
    ctx.throw(Status.Unauthorized, "Incorrect password");
  }

  // Check 2FA token when enabled
  if (userInfo.settings?.twoFactorAuth) {
    isString(body?.totpToken, ctx);
    const totp = new TOTP(userInfo.settings.twoFactorKey as string);
    const isValid = totp.verify(body?.totpToken as string);

    if (!isValid) {
      ctx.throw(Status.Unauthorized, "Incorrect 2FA code");
    }
  }

  await next();
};

export const jwt: Middleware = async (
  ctx,
  next,
): Promise<void> => {
  const reqJwt = ctx.request.headers.get("Authorization")?.split(" ")[1];
  if (!reqJwt) {
    ctx.throw(Status.BadRequest, "Missing authorization header");
  }
  isString(reqJwt, ctx);
  const isValid = await isValidJwt(
    reqJwt as string,
    await diskLogic.readJwtPublicKeyFile(),
  );
  if (!isValid) {
    ctx.throw(Status.Unauthorized, "Invalid JWT");
  }
  await next();
};
