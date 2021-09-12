import {Router as expressRouter} from 'express';

import {safeHandler} from '@runcitadel/utils';

import socksProxyAgentPkg from 'socks-proxy-agent';
import fetch from 'node-fetch';
import constants, {STATUS_CODES} from '../../utils/const.js';
import * as auth from '../../middlewares/auth.js';

const router = expressRouter();
const {SocksProxyAgent} = socksProxyAgentPkg;

const agent = new SocksProxyAgent(
  `socks5h://${constants.TOR_PROXY_IP}:${constants.TOR_PROXY_PORT}`,
);

router.get(
  '/price',
  auth.jwt,
  safeHandler(async (request, response) => {
    // Default to USD
    const currency = (request.query.currency as string) || 'USD';
    const apiResponse = await fetch(
      `https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=${currency}`,
      {
        agent,
        method: 'GET',
      },
    );

    try {
      return response.status(STATUS_CODES.OK).json(apiResponse.json());
    } catch {
      return response.status(STATUS_CODES.BAD_GATEWAY).json();
    }
  }),
);

export default router;
