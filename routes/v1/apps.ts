import Router from '@koa/router';

import * as appsLogic from '../../logic/apps.js';

import * as auth from '../../middlewares/auth.js';

import {STATUS_CODES} from '../../utils/const.js';

const router = new Router({
  prefix: '/v1/apps',
});

router.use(async (ctx, next) => {
  try {
    await next();
  } catch (error: unknown | Error) {
    ctx.status = (error as {status: number}).status || 500;
    ctx.body = JSON.stringify(
      (error as {message: string}).message || 'An error occurred',
    );
    ctx.app.emit('error', error, ctx);
  }
});

router.get('/', auth.jwt, async (ctx, next) => {
  const query = {
    installed: ctx.request.query.installed === '1',
  };
  const apps = await appsLogic.get(query);
  ctx.body = apps;
  await next();
});

router.post('/:id/install', auth.jwt, async (ctx, next) => {
  const {id} = ctx.params;
  await appsLogic.install(id);
  ctx.body = {};
  ctx.status = STATUS_CODES.OK;
  await next();
});

router.post('/:id/uninstall', auth.jwt, async (ctx, next) => {
  const {id} = ctx.params;
  await appsLogic.uninstall(id);
  ctx.body = {};
  ctx.status = STATUS_CODES.OK;
  await next();
});

export default router;
