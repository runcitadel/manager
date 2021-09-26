/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import Router from '@koa/router';

import {typeHelper, errorHandler} from '@runcitadel/utils';
import type {user as userFile} from '@runcitadel/utils';
import * as authLogic from '../../logic/auth.js';

import * as auth from '../../middlewares/auth.js';

import {STATUS_CODES} from '../../utils/const.js';

const router = new Router({
  prefix: '/v1/account',
});

const COMPLETE = 100;

router.use(errorHandler);

// Endpoint to change your password.
router.post(
  '/change-password',
  auth.convertRequestBodyToBasicAuth,
  auth.basic,
  async (ctx, next) => {
    if (
      typeof ctx.request.body.password !== 'string' ||
      typeof ctx.request.body.newPassword !== 'string'
    )
      ctx.throw('Received invalid data.');
    // Use password from the body by default. Basic auth has issues handling special characters.
    const currentPassword: string = ctx.request.body.password as string;
    const newPassword: string = ctx.request.body.newPassword as string;

    try {
      typeHelper.isString(currentPassword, ctx);
      typeHelper.isMinPasswordLength(currentPassword, ctx);
      typeHelper.isString(newPassword, ctx);
      typeHelper.isMinPasswordLength(newPassword, ctx);
      if (newPassword === currentPassword) {
        ctx.throw('The new password must not be the same as existing password');
      }
    } catch {
      ctx.throw('Invalid password supplied.');
      return;
    }

    const status = authLogic.getChangePasswordStatus();

    // Return a conflict if a change password process is already running
    if (status.percent > 0 && status.percent !== COMPLETE) {
      ctx.status = STATUS_CODES.CONFLICT;
    }

    try {
      // Start change password process in the background and immediately return
      await authLogic.changePassword(currentPassword, newPassword);
      ctx.status = STATUS_CODES.OK;
    } catch (error: unknown) {
      ctx.throw(typeof error === 'string' ? error : JSON.stringify(error));
    }

    await next();
  },
);

// Returns the current status of the change password process.
router.get('/change-password/status', auth.jwt, async (ctx, next) => {
  const status = authLogic.getChangePasswordStatus();
  ctx.body = status;
  await next();
});

// Registered does not need auth. This is because the user may not be registered at the time and thus won't always have
// an auth token.
router.get('/registered', async (ctx, next) => {
  ctx.body = {registered: await authLogic.isRegistered()};
  await next();
});

// Endpoint to register a password with the device. Wallet must not exist. This endpoint is authorized with basic auth
// or the property password from the body.
router.post(
  '/register',
  auth.convertRequestBodyToBasicAuth,
  auth.register,
  async (ctx, next) => {
    const seed: string[] = ctx.request.body.seed as string[];
    const user: userFile = ctx.state.user as userFile;

    if (seed.length !== 24) {
      throw new Error('Invalid seed length');
    }

    typeHelper.isString(ctx.request.body.name, ctx);
    typeHelper.isString(user.plainTextPassword, ctx);
    typeHelper.isMinPasswordLength(user.plainTextPassword!, ctx);

    // Add name to user obj
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
    user.name = ctx.request.body.name;

    const jwt = await authLogic.register(user, seed);

    ctx.body = {jwt};
    await next();
  },
);

router.post(
  '/login',
  auth.convertRequestBodyToBasicAuth,
  auth.basic,
  async (ctx, next) => {
    const jwt = await authLogic.login(ctx.state.user as userFile);

    ctx.body = {jwt};
    await next();
  },
);

router.get('/info', auth.jwt, async (ctx, next) => {
  ctx.body = await authLogic.getInfo();
  await next();
});

router.post(
  '/seed',
  auth.convertRequestBodyToBasicAuth,
  auth.basic,
  async (ctx, next) => {
    const seed = await authLogic.seed(ctx.state.user as userFile);
    ctx.body = {seed};
    await next();
  },
);

router.post('/refresh', auth.jwt, async (ctx, next) => {
  const jwt = await authLogic.refresh(ctx.state.user as userFile);
  ctx.body = {jwt};
  await next();
});

export default router;
