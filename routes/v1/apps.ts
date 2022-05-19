import Router from '@koa/router';
import {errorHandler, STATUS_CODES} from '@runcitadel/utils';

import * as appsLogic from '../../logic/apps.js';
import * as diskLogic from '../../logic/disk.js';
import {refresh as refreshJwt} from '../../logic/auth.js';

import * as auth from '../../middlewares/auth.js';
import {runCommand} from '../../services/karen.js';

const router = new Router({
  prefix: '/v1/apps',
});

router.use(errorHandler);

router.get('/', auth.jwt, async (ctx, next) => {
  const query = {
    installed: ctx.request.query.installed === '1',
  };
  const jwt = await refreshJwt(ctx.state.user as diskLogic.UserFile);
  const apps = await appsLogic.get(query, jwt);
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

router.post('/:id/update', auth.jwt, async (ctx, next) => {
  const {id} = ctx.params;
  await appsLogic.update(id);
  ctx.body = {};
  ctx.status = STATUS_CODES.OK;
  await next();
});

router.get('/updates', auth.jwt, async (ctx, next) => {
  ctx.body = await appsLogic.getAvailableUpdates();
  ctx.status = STATUS_CODES.OK;
  await next();
});

router.post('/update', auth.jwt, async (ctx, next) => {
  await runCommand('trigger app-update');
  ctx.body = {};
  ctx.status = STATUS_CODES.OK;
  await next();
});

export default router;
