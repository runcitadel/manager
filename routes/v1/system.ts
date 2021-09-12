import {Router as expressRouter} from 'express';

import {safeHandler} from '@runcitadel/utils';
import * as systemLogic from '../../logic/system.js';
import * as diskLogic from '../../logic/disk.js';

import * as auth from '../../middlewares/auth.js';

import constants, {STATUS_CODES} from '../../utils/const.js';

const router = expressRouter();

router.get(
  '/info',
  auth.jwt,
  safeHandler(async (request, response) => {
    const info = await systemLogic.getInfo();

    return response.status(STATUS_CODES.OK).json(info);
  }),
);

router.get(
  '/status',
  auth.jwt,
  safeHandler(async (request, response) => {
    const status = await systemLogic.status();

    return response.status(STATUS_CODES.OK).json(status);
  }),
);

router.post(
  '/clear-memory-warning',
  auth.jwt,
  safeHandler(async (request, response) => {
    const result = await systemLogic.clearMemoryWarning();

    return response.status(STATUS_CODES.OK).json(result);
  }),
);

router.get(
  '/dashboard-hidden-service',
  auth.jwt,
  safeHandler(async (request, response) => {
    const url = await systemLogic.getHiddenServiceUrl();

    return response.status(STATUS_CODES.OK).json(url);
  }),
);

router.get(
  '/electrum-connection-details',
  auth.jwt,
  safeHandler(async (request, response) => {
    const connectionDetails = await systemLogic.getElectrumConnectionDetails();

    return response.status(STATUS_CODES.OK).json(connectionDetails);
  }),
);

router.get(
  '/bitcoin-p2p-connection-details',
  auth.jwt,
  safeHandler(async (request, response) => {
    const connectionDetails =
      await systemLogic.getBitcoinP2PConnectionDetails();

    return response.status(STATUS_CODES.OK).json(connectionDetails);
  }),
);

router.get(
  '/bitcoin-rpc-connection-details',
  auth.jwt,
  safeHandler(async (request, response) => {
    const connectionDetails =
      await systemLogic.getBitcoinRPCConnectionDetails();

    return response.status(STATUS_CODES.OK).json(connectionDetails);
  }),
);

router.get(
  '/lndconnect-urls',
  auth.jwt,
  safeHandler(async (request, response) => {
    const urls = await systemLogic.getLndConnectUrls();

    return response.status(STATUS_CODES.OK).json(urls);
  }),
);

router.get(
  '/get-update',
  auth.jwt,
  safeHandler(async (request, response) => {
    const update = await systemLogic.getAvailableUpdate();

    return response.status(STATUS_CODES.OK).json(update);
  }),
);

router.get(
  '/update-status',
  safeHandler(async (request, response) => {
    const update = await systemLogic.getUpdateStatus();

    return response.status(STATUS_CODES.OK).json(update);
  }),
);

router.post(
  '/update',
  auth.jwt,
  safeHandler(async (request, response) => {
    const status = await systemLogic.startUpdate();

    return response.status(STATUS_CODES.OK).json(status);
  }),
);

router.get(
  '/backup-status',
  safeHandler(async (request, response) => {
    const backup = await systemLogic.getBackupStatus();

    return response.status(STATUS_CODES.OK).json(backup);
  }),
);

router.get(
  '/debug-result',
  auth.jwt,
  safeHandler(async (request, response) => {
    const result = await systemLogic.getDebugResult();

    return response.status(STATUS_CODES.OK).json(result);
  }),
);

router.post(
  '/debug',
  auth.jwt,
  safeHandler(async (request, response) => {
    const result = await systemLogic.requestDebug();

    return response.status(STATUS_CODES.OK).json(result);
  }),
);

router.post(
  '/shutdown',
  auth.jwt,
  safeHandler(async (request, response) => {
    const result = await systemLogic.requestShutdown();

    return response.status(STATUS_CODES.OK).json(result);
  }),
);

router.post(
  '/reboot',
  auth.jwt,
  safeHandler(async (request, response) => {
    const result = await systemLogic.requestReboot();

    return response.status(STATUS_CODES.OK).json(result);
  }),
);

router.get(
  '/storage',
  safeHandler(async (request, response) => {
    const update = await diskLogic.readJsonStatusFile('storage');

    return response.status(STATUS_CODES.OK).json(update);
  }),
);

router.get(
  '/memory',
  safeHandler(async (request, response) => {
    const update = await diskLogic.readJsonStatusFile('memory');

    return response.status(STATUS_CODES.OK).json(update);
  }),
);

router.get(
  '/temperature',
  safeHandler(async (request, response) => {
    const update = await diskLogic.readJsonStatusFile('temperature');

    return response.status(STATUS_CODES.OK).json(update);
  }),
);

router.get(
  '/uptime',
  safeHandler(async (request, response) => {
    const update = await diskLogic.readJsonStatusFile('uptime');

    return response.status(STATUS_CODES.OK).json(update);
  }),
);

router.get(
  '/is-umbrel-os',
  safeHandler(async (request, response) =>
    response.status(STATUS_CODES.OK).json(constants.IS_UMBREL_OS),
  ),
);

export default router;
