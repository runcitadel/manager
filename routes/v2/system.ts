import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import * as typeHelper from '../../utils/types.ts';

import * as systemLogic from '../../logic/system.ts';
import * as diskLogic from '../../logic/disk.ts';
import * as auth from '../../middlewares/auth.ts';
import constants from '../../utils/const.ts';


const router = new Router({
  prefix: "/v2/system",
});


router.get('/info', auth.jwt, async (ctx, next) => {
  ctx.response.body = await systemLogic.getInfo();
  await next();
});

router.get('/dashboard-hidden-service', auth.jwt, async (ctx, next) => {
  const url = await diskLogic.readHiddenService('web');

  ctx.response.body = {url};
  await next();
});

router.get('/electrum-connection-details', auth.jwt, async (ctx, next) => {
  ctx.response.body = await systemLogic.getElectrumConnectionDetails();
  await next();
});

router.get('/bitcoin-p2p-connection-details', auth.jwt, async (ctx, next) => {
  ctx.response.body = await systemLogic.getBitcoinP2pConnectionDetails();
  await next();
});

router.get('/bitcoin-rpc-connection-details', auth.jwt, async (ctx, next) => {
  ctx.response.body = await systemLogic.getBitcoinRpcConnectionDetails();
  await next();
});

router.get('/lndconnect-urls', auth.jwt, async (ctx, next) => {
  ctx.response.body = await systemLogic.getLndConnectUrls();
  await next();
});


router.get('/get-update', auth.jwt, async (ctx, next) => {
  ctx.response.body = await systemLogic.getAvailableUpdate();
  await next();
});

router.get('/get-update-details', auth.jwt, async (ctx, next) => {
  const update = await systemLogic.getAvailableUpdate();

  ctx.response.body = {update};
  await next();
});

router.get('/update-status', async (ctx, next) => {
  ctx.response.body = await systemLogic.getUpdateStatus();
  await next();
});

router.post('/update', auth.jwt, async (ctx, next) => {
  ctx.response.body = await systemLogic.startUpdate();
  await next();
});

router.post('/quick-update', auth.jwt, async (ctx, next) => {
  await systemLogic.startQuickUpdate();
  ctx.response.body = {};
  await next();
});

router.get('/backup-status', auth.jwt, async (ctx, next) => {
  ctx.response.body = await systemLogic.getBackupStatus();
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
  ctx.response.body = await diskLogic.readJsonStatusFile('storage');
  await next();
});

router.get('/memory', async (ctx, next) => {
  ctx.response.body = await diskLogic.readJsonStatusFile('memory');
  await next();
});

router.get('/temperature', auth.jwt, async (ctx, next) => {
  ctx.response.body = {
    temperature: await diskLogic.readJsonStatusFile('temperature'),
  };
  await next();
});

router.get('/uptime', auth.jwt, async (ctx, next) => {
  ctx.response.body = {
    uptime: await diskLogic.readJsonStatusFile('uptime'),
  };
  await next();
});

router.get('/disk-type', auth.jwt, async (ctx, next) => {
  let externalStorage: 'nvme' | 'unknown' = 'unknown';
  try {
    const externalStorageUnformatted = await diskLogic.readTextStatusFile(
      'external_storage',
    );
    externalStorage =
      (externalStorageUnformatted.trim() as
        | 'nvme'
        | 'unknown') || 'unknown';
  } catch (error: unknown) {
    console.error(error);
  }

  ctx.response.body = {externalStorage};
  await next();
});

router.put('/update-channel', auth.jwt, async (ctx, next) => {
  const body = await ctx.request.body({
    type: "json",
  }).value;
  typeHelper.isString(body.channel, ctx);
  await systemLogic.setUpdateChannel(body.channel as string);
  ctx.response.body = {};
  await next();
});

router.get('/update-channel', auth.jwt, async (ctx, next) => {
  ctx.response.body = {
    channel: constants.GITHUB_BRANCH,
  };
  await next();
});

router.get('/', auth.jwt, async (ctx, next) => {
  ctx.response.body = {os: constants.IS_CITADEL_OS ? 'Citadel OS' : 'unknown'};
  await next();
});

export default router;
