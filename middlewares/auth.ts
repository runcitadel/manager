import { isValidJwt } from "../utils/jwt.ts";
import * as diskLogic from "../logic/disk.ts";
import { isString } from "../utils/types.ts";
import notp from "https://esm.sh/notp@2.0.3";

import Rsa from "https://esm.sh/node-rsa@1.1.1";
import {
  Middleware,
  Status,
} from "https://deno.land/x/oak@v11.1.0/mod.ts";

import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.0/mod.ts";

export async function generateJwtKeys(): Promise<void> {
  const key = new Rsa({ b: 4096 });

  const privateKey = key.exportKey("private");
  const publicKey = key.exportKey("public");

  await diskLogic.writeJwtPrivateKeyFile(privateKey);
  await diskLogic.writeJwtPublicKeyFile(publicKey);
}

// Override the authorization header with password that is in the body of the request if basic auth was not supplied.
export const convertRequestBodyToBasicAuth: Middleware = async (
  ctx,
  next,
): Promise<void> => {
  const body = await ctx.request.body({
    type: "json",
  }).value;
  if (body.password && !ctx.request.headers.get("authorization")) {
    // We need to Base64 encode because Passport breaks on ":" characters
    ctx.request.headers.set("authorization", "Basic " + body.password);
  }

  await next();
};

export const basic: Middleware = async (
  ctx,
  next,
): Promise<void> => {
  const reqPassword = ctx.request.headers.get("Authorization")?.split(" ")[1];
  if (!reqPassword) {
    ctx.throw(Status.BadRequest, '"Missing authorization header"');
  }
  isString(reqPassword, ctx);
  let userInfo: diskLogic.UserFile;
  try {
    userInfo = await diskLogic.readUserFile();
  } catch {
    ctx.throw(Status.Unauthorized, '"No user registered"');
    throw new TypeError("This error should not be visible, but is required to get TypeScript to shut up");
  }

  const storedPassword = userInfo.password;
  if (!storedPassword) {
    ctx.throw(Status.InternalServerError, '"No password stored"');
  }

  const equal = await bcrypt.compare(reqPassword as string, storedPassword as string);
  if (!equal) {
    ctx.throw(Status.Unauthorized, '"Incorrect password"');
  }

  const body = await ctx.request.body({
    type: "json",
  }).value;

  // Check 2FA token when enabled
  if (userInfo.settings?.twoFactorAuth) {
    isString(body.totpToken, ctx);
    const vres = notp.totp.verify(
      body.totpToken,
      userInfo.settings.twoFactorKey || "",
    );

    if (!vres || vres.delta !== 0) {
      ctx.throw(Status.Unauthorized, '"Incorrect 2FA code"');
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
    ctx.throw(Status.BadRequest, '"Missing authorization header"');
  }
  isString(reqJwt, ctx);
  const isValid = await isValidJwt(
    reqJwt as string,
    await diskLogic.readJwtPublicKeyFile(),
  );
  if (!isValid) {
    ctx.throw(Status.Unauthorized, '"Invalid JWT"');
  }
  await next();
};
