import Router from '@koa/router';
import {errorHandler, STATUS_CODES} from '@runcitadel/utils';

import * as appsLogic from '../../logic/apps.js';

import * as auth from '../../middlewares/auth.js';

const router = new Router({
  prefix: '/v3/apps',
});

router.use(errorHandler);

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
