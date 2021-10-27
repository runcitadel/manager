import Router from '@koa/router';
import {errorHandler} from '@runcitadel/utils';

import * as systemLogic from '../../logic/system.js';
import * as diskLogic from '../../logic/disk.js';

import * as auth from '../../middlewares/auth.js';

import * as constants from '../../utils/const.js';

const router = new Router({
  prefix: '/v3/system',
});

router.use(errorHandler);

router.get('/info', auth.jwt, async (ctx, next) => {
  ctx.body = await systemLogic.getInfo();
  await next();
});

router.get('/status', auth.jwt, async (ctx, next) => {
  ctx.body = await systemLogic.status();
  await next();
});

router.post('/clear-memory-warning', auth.jwt, async (ctx, next) => {
  ctx.body = await systemLogic.clearMemoryWarning();
  await next();
});

router.get('/dashboard-hidden-service', auth.jwt, async (ctx, next) => {
  const url = await systemLogic.getHiddenServiceUrl();

  ctx.body = {url};
  await next();
});

router.get('/electrum-connection-details', auth.jwt, async (ctx, next) => {
  ctx.body = await systemLogic.getElectrumConnectionDetails();
  await next();
});

router.get('/bitcoin-p2p-connection-details', auth.jwt, async (ctx, next) => {
  ctx.body = await systemLogic.getBitcoinP2pConnectionDetails();
  await next();
});

router.get('/bitcoin-rpc-connection-details', auth.jwt, async (ctx, next) => {
  ctx.body = await systemLogic.getBitcoinRpcConnectionDetails();
  await next();
});

router.get('/lndconnect-urls', auth.jwt, async (ctx, next) => {
  ctx.body = await systemLogic.getLndConnectUrls();
  await next();
});

router.get('/get-update', auth.jwt, async (ctx, next) => {
  ctx.body = await systemLogic.getAvailableUpdate();
  await next();
});

router.get('/get-update-details', auth.jwt, async (ctx, next) => {
  const update = await systemLogic.getAvailableUpdate();

  ctx.body = {update};
  await next();
});

router.get('/update-status', async (ctx, next) => {
  ctx.body = await systemLogic.getUpdateStatus();
  await next();
});

router.post('/update', auth.jwt, async (ctx, next) => {
  ctx.body = await systemLogic.startUpdate();
  await next();
});

router.get('/backup-status', async (ctx, next) => {
  ctx.body = await systemLogic.getBackupStatus();
  await next();
});

router.get('/debug-result', auth.jwt, async (ctx, next) => {
  ctx.body = await systemLogic.getDebugResult();
  await next();
});

router.post('/debug', auth.jwt, async (ctx, next) => {
  ctx.body = await systemLogic.requestDebug();
  await next();
});

router.post('/shutdown', auth.jwt, async (ctx, next) => {
  ctx.body = await systemLogic.requestShutdown();
  await next();
});

router.post('/reboot', auth.jwt, async (ctx, next) => {
  ctx.body = await systemLogic.requestReboot();
  await next();
});

router.get('/storage', async (ctx, next) => {
  ctx.body = await diskLogic.readJsonStatusFile('storage');
  await next();
});

router.get('/memory', async (ctx, next) => {
  ctx.body = await diskLogic.readJsonStatusFile('memory');
  await next();
});

router.get('/temperature', async (ctx, next) => {
  ctx.body = {
    temperature: await diskLogic.readJsonStatusFile('temperature'),
  };
  await next();
});

router.get('/uptime', async (ctx, next) => {
  ctx.body = {
    uptime: await diskLogic.readJsonStatusFile('uptime'),
  };
  await next();
});

router.get('/', async (ctx, next) => {
  ctx.body = {os: constants.IS_CITADEL_OS ? 'Citadel OS' : 'unknown'};
  await next();
});

export default router;
