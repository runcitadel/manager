import Router from '@koa/router';
import type {Context} from 'koa';

import {typeHelper, errorHandler, STATUS_CODES} from '@runcitadel/utils';
import User from '../../logic/user.js';

import * as auth from '../../middlewares/auth-multiuser.js';

const router = new Router({
  prefix: '/v3/account',
});

router.use(errorHandler);

type ExtendedContext = Context & {
  state: {
    user: User;
  };
};

// Endpoint to change your password.
router.post(
  '/change-own-password',
  auth.jwt,
  async (ctx: ExtendedContext, next) => {
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
    }

    try {
      if (!(await ctx.state.user.validatePassword(currentPassword)))
        ctx.throw('Invalid password supplied.');
      await ctx.state.user.changePassword(newPassword);
      ctx.status = STATUS_CODES.OK;
    } catch (error: unknown) {
      ctx.throw(typeof error === 'string' ? error : JSON.stringify(error));
    }

    await next();
  },
);

// Endpoint to change your password.
router.post('/change-user-password', auth.admin, async (ctx, next) => {
  if (
    typeof ctx.request.body.newPassword !== 'string' ||
    typeof ctx.request.body.userId !== 'string'
  )
    ctx.throw('Received invalid data.');
  const newPassword: string = ctx.request.body.newPassword as string;

  try {
    typeHelper.isString(newPassword, ctx);
    typeHelper.isMinPasswordLength(newPassword, ctx);
  } catch {
    ctx.throw('Invalid password supplied.');
    return;
  }

  try {
    const user = await User.get(ctx.request.body.userId);
    await user.changePassword(newPassword);
    ctx.status = STATUS_CODES.OK;
  } catch (error: unknown) {
    ctx.throw(typeof error === 'string' ? error : JSON.stringify(error));
  }

  await next();
});

router.post(
  '/login',
  auth.convertRequestBodyToBasicAuth,
  auth.basic,
  async (ctx: ExtendedContext, next) => {
    const jwt = await ctx.state.user.getJwt();
    ctx.body = {jwt};
    await next();
  },
);

router.get('/info', auth.jwt, async (ctx: ExtendedContext, next) => {
  const data = await ctx.state.user.getData();
  ctx.body = {
    name: data.name,
    balance: {
      onChain: data.onChainBalance,
      offChain: data.lightningBalance,
    },
    apps: data.installedApps,
    permissions: data.permissions,
  };
  await next();
});

router.post('/refresh', auth.jwt, async (ctx: ExtendedContext, next) => {
  const jwt = await ctx.state.user.getJwt();
  ctx.body = {jwt};
  await next();
});

export default router;
