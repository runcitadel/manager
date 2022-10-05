import { Router, Status } from "https://deno.land/x/oak@v11.1.0/mod.ts";

import * as diskLogic from "../../logic/disk.ts";
import * as auth from "../../middlewares/auth.ts";
import * as typeHelper from "../../utils/types.ts";

import { TOTP } from "https://deno.land/x/god_crypto@v1.4.10/otp.ts";
import * as authLogic from "../../logic/auth.ts";
import { getPasswordFromContext } from "../../utils/auth.ts";

const router = new Router({
  prefix: "/v1/account",
});

// Endpoint to change your password.
router.post(
  "/change-password",
  auth.basic,
  async (ctx, next) => {
    const body = await ctx.request.body({
      type: "json",
    }).value;
    if (
      typeof body.password !== "string" ||
      typeof body.newPassword !== "string"
    ) {
      ctx.throw(Status.BadRequest, "Received invalid data.");
    }

    // Use password from the body by default. Basic auth has issues handling special characters.
    const currentPassword: string = body.password as string;
    const newPassword: string = body.newPassword as string;

    try {
      typeHelper.isString(currentPassword, ctx);
      //typeHelper.isMinPasswordLength(currentPassword, ctx);
      typeHelper.isString(newPassword, ctx);
      typeHelper.isMinPasswordLength(newPassword, ctx);
    } catch {
      ctx.throw(Status.BadRequest, "Invalid password supplied.");
      return;
    }
    if (newPassword === currentPassword) {
      ctx.throw(
        Status.BadRequest,
        "The new password must not be the same as existing password",
      );
    }

    try {
      // Start change password process in the background and immediately return
      await authLogic.changePassword(currentPassword, newPassword);
      ctx.response.status = Status.OK;
      ctx.response.body = { percent: 100 };
    } catch (error: unknown) {
      ctx.throw(
        Status.InternalServerError,
        typeof error === "string" ? error : ((error as { message?: string }).message || JSON.stringify(error)),
      );
    }

    await next();
  },
);

// Returns the current status of the change password process.
router.get("/change-password/status", auth.jwt, async (ctx, next) => {
  ctx.response.body = { percent: 100 };
  await next();
});

// Registered does not need auth. This is because the user may not be registered at the time and thus won't always have
// an auth token.
router.get("/registered", async (ctx, next) => {
  ctx.response.body = { registered: await authLogic.isRegistered() };
  await next();
});

// Endpoint to register a password with the device. Wallet must not exist. This endpoint is authorized with basic auth
// or the property password from the body.
router.post(
  "/register",
  async (ctx, next) => {
    const body = await ctx.request.body({
      type: "json",
    }).value;
    const plainTextPassword = await getPasswordFromContext(ctx);
    typeHelper.isString(plainTextPassword, ctx);
    const seed: string[] = body.seed as string[];

    if (seed.length !== 24) {
      ctx.throw(Status.BadRequest, "Invalid seed length");
    }

    typeHelper.isString(body.name, ctx);
    typeHelper.isString(plainTextPassword, ctx);
    typeHelper.isMinPasswordLength(plainTextPassword, ctx);

    const jwt = await authLogic.register(body.name, plainTextPassword, seed);

    ctx.response.body = { jwt };
    await next();
  },
);

router.post(
  "/login",
  auth.basic,
  async (ctx, next) => {
    const plainTextPassword = await getPasswordFromContext(ctx);
    typeHelper.isString(plainTextPassword, ctx);
    const jwt = await authLogic.login(plainTextPassword);

    ctx.response.body = { jwt };
    await next();
  },
);

router.get("/info", auth.jwt, async (ctx, next) => {
  ctx.response.body = await authLogic.getInfo();
  await next();
});

router.post(
  "/seed",
  auth.basic,
  async (ctx, next) => {
    const plainTextPassword = await getPasswordFromContext(ctx);
    const seed = await authLogic.seed(plainTextPassword);
    ctx.response.body = { seed };
    await next();
  },
);

router.post("/refresh", auth.jwt, async (ctx, next) => {
  const jwt = await authLogic.refresh();
  ctx.response.body = { jwt };
  await next();
});

router.get("/totp/setup", auth.jwt, async (ctx, next) => {
  const info = await authLogic.getInfo();
  const twoFactorKey = info.settings?.twoFactorKey
    ? info.settings?.twoFactorKey
    : undefined;
  const key = await authLogic.setupTotp(twoFactorKey);
  const encodedKey = authLogic.encodeKey(key);
  ctx.response.body = { key: encodedKey.toString() };
  await next();
});

router.post("/totp/enable", auth.jwt, async (ctx) => {
  const body = await ctx.request.body({
    type: "json",
  }).value;
  const info = await authLogic.getInfo();

  if (info.settings?.twoFactorKey && body.authenticatorToken) {
    // TOTP should be already set up
    const key = info.settings?.twoFactorKey;

    typeHelper.isString(body.authenticatorToken, ctx);
    const totp = new TOTP(key as string);
    const isValid = totp.verify(body.authenticatorToken as string);

    if (isValid) {
      await authLogic.enableTotp(key);
      ctx.response.body = { success: true };
    } else {
      ctx.throw(Status.Unauthorized, "TOTP token invalid");
    }
  } else {
    ctx.throw(Status.InternalServerError, "TOTP enable failed");
  }
});

router.post("/totp/disable", auth.jwt, async (ctx, next) => {
  const info = await authLogic.getInfo();
  const body = await ctx.request.body({
    type: "json",
  }).value;

  if (info.settings?.twoFactorKey && body.authenticatorToken) {
    // TOTP should be already set up
    const key = info.settings?.twoFactorKey;

    typeHelper.isString(body.authenticatorToken, ctx);
    const totp = new TOTP(key as string);
    const isValid = totp.verify(body.authenticatorToken as string);

    if (isValid) {
      await diskLogic.disable2fa();
      ctx.response.body = { success: true };
    } else {
      ctx.throw(Status.Unauthorized, "TOTP token invalid");
    }
  } else {
    ctx.throw(Status.InternalServerError, "TOTP disable failed");
  }

  await next();
});

// Returns the current status of TOTP.
router.get("/totp/status", async (ctx, next) => {
  const userFile = await diskLogic.readUserFile();
  const status = userFile.settings?.twoFactorAuth ?? false;
  ctx.response.body = { totpEnabled: status };
  await next();
});

export default router;
