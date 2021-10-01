import Router from '@koa/router';
import {errorHandler} from '@runcitadel/utils';

import * as systemLogic from '../../logic/system.js';
import * as diskLogic from '../../logic/disk.js';

import * as auth from '../../middlewares/auth.js';

import * as constants from '../../utils/const.js';

const router = new Router({
  prefix: '/v1/system',
});

router.use(errorHandler);

router.get('/info', auth.jwt, async (ctx, next) => {
  const info = await systemLogic.getInfo();

  ctx.body = info;
  await next();
});

router.get('/status', auth.jwt, async (ctx, next) => {
  const status = await systemLogic.status();

  ctx.body = status;
  await next();
});

router.post('/clear-memory-warning', auth.jwt, async (ctx, next) => {
  const result = await systemLogic.clearMemoryWarning();

  ctx.body = result;
  await next();
});

router.get('/dashboard-hidden-service', auth.jwt, async (ctx, next) => {
  const url = await systemLogic.getHiddenServiceUrl();

  ctx.body = url;
  await next();
});

router.get('/hidden-service', auth.jwt, async (ctx, next) => {
  const url = await systemLogic.getHiddenServiceUrl();

  ctx.body = {url};
  await next();
});

router.get('/electrum-connection-details', auth.jwt, async (ctx, next) => {
  const connectionDetails = await systemLogic.getElectrumConnectionDetails();

  ctx.body = connectionDetails;
  await next();
});

router.get('/bitcoin-p2p-connection-details', auth.jwt, async (ctx, next) => {
  const connectionDetails = await systemLogic.getBitcoinP2PConnectionDetails();

  ctx.body = connectionDetails;
  await next();
});

router.get('/bitcoin-rpc-connection-details', auth.jwt, async (ctx, next) => {
  const connectionDetails = await systemLogic.getBitcoinRPCConnectionDetails();

  ctx.body = connectionDetails;
  await next();
});

router.get('/lndconnect-urls', auth.jwt, async (ctx, next) => {
  const urls = await systemLogic.getLndConnectUrls();

  ctx.body = urls;
  await next();
});

router.get('/get-update', auth.jwt, async (ctx, next) => {
  const update = await systemLogic.getAvailableUpdate();

  ctx.body = update;
  await next();
});

router.get('/get-update-details', auth.jwt, async (ctx, next) => {
  const update = await systemLogic.getAvailableUpdate();

  ctx.body = {update};
  await next();
});

router.get('/update-status', async (ctx, next) => {
  const update = await systemLogic.getUpdateStatus();

  ctx.body = update;
  await next();
});

router.post('/update', auth.jwt, async (ctx, next) => {
  const status = await systemLogic.startUpdate();

  ctx.body = status;
  await next();
});

router.get('/backup-status', async (ctx, next) => {
  const backup = await systemLogic.getBackupStatus();

  ctx.body = backup;
  await next();
});

router.get('/debug-result', auth.jwt, async (ctx, next) => {
  const result = await systemLogic.getDebugResult();

  ctx.body = result;
  await next();
});

router.post('/debug', auth.jwt, async (ctx, next) => {
  const result = await systemLogic.requestDebug();

  ctx.body = result;
  await next();
});

router.post('/shutdown', auth.jwt, async (ctx, next) => {
  const result = await systemLogic.requestShutdown();

  ctx.body = result;
  await next();
});

router.post('/reboot', auth.jwt, async (ctx, next) => {
  const result = await systemLogic.requestReboot();

  ctx.body = result;
  await next();
});

router.get('/storage', async (ctx, next) => {
  const update = await diskLogic.readJsonStatusFile('storage');

  ctx.body = update;
  await next();
});

router.get('/memory', async (ctx, next) => {
  const update = await diskLogic.readJsonStatusFile('memory');

  ctx.body = update;
  await next();
});

router.get('/temperature', async (ctx, next) => {
  const update = await diskLogic.readJsonStatusFile('temperature');

  ctx.body = update;
  await next();
});

router.get('/uptime', async (ctx, next) => {
  const update = await diskLogic.readJsonStatusFile('uptime');

  ctx.body = update;
  await next();
});

router.get('/is-umbrel-os', async (ctx, next) => {
  ctx.body = constants.IS_UMBREL_OS;
  await next();
});

export default router;
