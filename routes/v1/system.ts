import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";

import * as systemLogic from '../../logic/system.ts';
import * as diskLogic from '../../logic/disk.ts';
import * as auth from '../../middlewares/auth.ts';
import constants from '../../utils/const.ts';

const router = new Router({
  prefix: '/v1/system',
});
router.get('/info', auth.jwt, async (ctx, next) => {
  const info = await systemLogic.getInfo();

  ctx.response.body = info;
  await next();
});

router.get('/dashboard-hidden-service', auth.jwt, async (ctx, next) => {
  const url = await diskLogic.readHiddenService('web');

  ctx.response.body = url;
  await next();
});

router.get('/electrum-connection-details', auth.jwt, async (ctx, next) => {
  const connectionDetails = await systemLogic.getElectrumConnectionDetails();

  ctx.response.body = connectionDetails;
  await next();
});

router.get('/bitcoin-p2p-connection-details', auth.jwt, async (ctx, next) => {
  const connectionDetails = await systemLogic.getBitcoinP2pConnectionDetails();

  ctx.response.body = connectionDetails;
  await next();
});

router.get('/bitcoin-rpc-connection-details', auth.jwt, async (ctx, next) => {
  const connectionDetails = await systemLogic.getBitcoinRpcConnectionDetails();

  ctx.response.body = connectionDetails;
  await next();
});

router.get('/lndconnect-urls', auth.jwt, async (ctx, next) => {
  const urls = await systemLogic.getLndConnectUrls();

  ctx.response.body = urls;
  await next();
});

router.get('/get-update', auth.jwt, async (ctx, next) => {
  const update = await systemLogic.getAvailableUpdate();

  ctx.response.body = update;
  await next();
});

router.get('/get-update-details', auth.jwt, async (ctx, next) => {
  const update = await systemLogic.getAvailableUpdate();

  ctx.response.body = {update};
  await next();
});

router.get('/update-status', async (ctx, next) => {
  const update = await systemLogic.getUpdateStatus();

  ctx.response.body = update;
  await next();
});

router.post('/update', auth.jwt, async (ctx, next) => {
  const status = await systemLogic.startUpdate();

  ctx.response.body = status;
  await next();
});

router.get('/backup-status', async (ctx, next) => {
  const backup = await systemLogic.getBackupStatus();

  ctx.response.body = backup;
  await next();
});

router.get('/debug-result', auth.jwt, async (ctx, next) => {
  ctx.response.body = await systemLogic.getDebugResult();
  await next();
});

router.post('/debug', auth.jwt, async (ctx, next) => {
  ctx.response.body = await systemLogic.requestDebug();
  await next();
});

router.post('/shutdown', auth.jwt, async (ctx, next) => {
  ctx.response.body = await systemLogic.requestShutdown();
  await next();
});

router.post('/reboot', auth.jwt, async (ctx, next) => {
  ctx.response.body = await systemLogic.requestReboot();
  await next();
});

router.get('/storage', async (ctx, next) => {
  const update = await diskLogic.readJsonStatusFile('storage');

  // deno-lint-ignore ban-types
  ctx.response.body = update as object;
  await next();
});

router.get('/memory', async (ctx, next) => {
  const update = await diskLogic.readJsonStatusFile('memory');

  // deno-lint-ignore ban-types
  ctx.response.body = update as object;
  await next();
});

router.get('/temperature', async (ctx, next) => {
  const update = await diskLogic.readJsonStatusFile('temperature');

  // deno-lint-ignore ban-types
  ctx.response.body = update as object;
  await next();
});

router.get('/uptime', async (ctx, next) => {
  const update = await diskLogic.readJsonStatusFile('uptime');

  // deno-lint-ignore ban-types
  ctx.response.body = update as object;
  await next();
});

router.get('/is-citadel-os', async (ctx, next) => {
  ctx.response.body = constants.IS_CITADEL_OS;
  await next();
});

export default router;
