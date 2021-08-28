import { Router } from "express";
const router = Router();

import * as systemLogic from "../../logic/system.js";
import * as diskLogic from "../../logic/disk.js";

import * as auth from "../../middlewares/auth.js";

import constants from "../../utils/const.js";
import { safeHandler } from "@runcitadel/utils";

router.get(
  "/info",
  auth.jwt,
  safeHandler(async (req, res) => {
    const info = await systemLogic.getInfo();

    return res.status(constants.STATUS_CODES.OK).json(info);
  })
);

router.get(
  "/status",
  auth.jwt,
  safeHandler(async (req, res) => {
    const status = await systemLogic.status();

    return res.status(constants.STATUS_CODES.OK).json(status);
  })
);

router.post(
  "/clear-memory-warning",
  auth.jwt,
  safeHandler(async (req, res) => {
    const result = await systemLogic.clearMemoryWarning();

    return res.status(constants.STATUS_CODES.OK).json(result);
  })
);

router.get(
  "/dashboard-hidden-service",
  auth.jwt,
  safeHandler(async (req, res) => {
    const url = await systemLogic.getHiddenServiceUrl();

    return res.status(constants.STATUS_CODES.OK).json(url);
  })
);

router.get(
  "/electrum-connection-details",
  auth.jwt,
  safeHandler(async (req, res) => {
    const connectionDetails = await systemLogic.getElectrumConnectionDetails();

    return res.status(constants.STATUS_CODES.OK).json(connectionDetails);
  })
);

router.get(
  "/bitcoin-p2p-connection-details",
  auth.jwt,
  safeHandler(async (req, res) => {
    const connectionDetails =
      await systemLogic.getBitcoinP2PConnectionDetails();

    return res.status(constants.STATUS_CODES.OK).json(connectionDetails);
  })
);

router.get(
  "/bitcoin-rpc-connection-details",
  auth.jwt,
  safeHandler(async (req, res) => {
    const connectionDetails =
      await systemLogic.getBitcoinRPCConnectionDetails();

    return res.status(constants.STATUS_CODES.OK).json(connectionDetails);
  })
);

router.get(
  "/lndconnect-urls",
  auth.jwt,
  safeHandler(async (req, res) => {
    const urls = await systemLogic.getLndConnectUrls();

    return res.status(constants.STATUS_CODES.OK).json(urls);
  })
);

router.get(
  "/get-update",
  auth.jwt,
  safeHandler(async (req, res) => {
    const update = await systemLogic.getAvailableUpdate();

    return res.status(constants.STATUS_CODES.OK).json(update);
  })
);

router.get(
  "/update-status",
  safeHandler(async (req, res) => {
    const update = await systemLogic.getUpdateStatus();

    return res.status(constants.STATUS_CODES.OK).json(update);
  })
);

router.post(
  "/update",
  auth.jwt,
  safeHandler(async (req, res) => {
    const status = await systemLogic.startUpdate();

    return res.status(constants.STATUS_CODES.OK).json(status);
  })
);

router.get(
  "/backup-status",
  safeHandler(async (req, res) => {
    const backup = await systemLogic.getBackupStatus();

    return res.status(constants.STATUS_CODES.OK).json(backup);
  })
);

router.get(
  "/debug-result",
  auth.jwt,
  safeHandler(async (req, res) => {
    const result = await systemLogic.getDebugResult();

    return res.status(constants.STATUS_CODES.OK).json(result);
  })
);

router.post(
  "/debug",
  auth.jwt,
  safeHandler(async (req, res) => {
    const result = await systemLogic.requestDebug();

    return res.status(constants.STATUS_CODES.OK).json(result);
  })
);

router.post(
  "/shutdown",
  auth.jwt,
  safeHandler(async (req, res) => {
    const result = await systemLogic.requestShutdown();

    return res.status(constants.STATUS_CODES.OK).json(result);
  })
);

router.post(
  "/reboot",
  auth.jwt,
  safeHandler(async (req, res) => {
    const result = await systemLogic.requestReboot();

    return res.status(constants.STATUS_CODES.OK).json(result);
  })
);

router.get(
  "/storage",
  safeHandler(async (req, res) => {
    const update = await diskLogic.readJsonStatusFile("storage");

    return res.status(constants.STATUS_CODES.OK).json(update);
  })
);

router.get(
  "/memory",
  safeHandler(async (req, res) => {
    const update = await diskLogic.readJsonStatusFile("memory");

    return res.status(constants.STATUS_CODES.OK).json(update);
  })
);

router.get(
  "/temperature",
  safeHandler(async (req, res) => {
    const update = await diskLogic.readJsonStatusFile("temperature");

    return res.status(constants.STATUS_CODES.OK).json(update);
  })
);

router.get(
  "/uptime",
  safeHandler(async (req, res) => {
    const update = await diskLogic.readJsonStatusFile("uptime");

    return res.status(constants.STATUS_CODES.OK).json(update);
  })
);

router.get(
  "/is-umbrel-os",
  safeHandler(async (req, res) => {
    return res.status(constants.STATUS_CODES.OK).json(constants.IS_UMBREL_OS);
  })
);

export default router;
