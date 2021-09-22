import Router from '@koa/router';

import socksProxyAgentPkg from 'socks-proxy-agent';
import fetch from 'node-fetch';
import * as constants from '../../utils/const.js';
import {STATUS_CODES} from '../../utils/const.js';
import * as auth from '../../middlewares/auth.js';

const router = new Router({
  prefix: '/v1/external',
});
const {SocksProxyAgent} = socksProxyAgentPkg;

const agent = new SocksProxyAgent(
  `socks5h://${constants.TOR_PROXY_IP}:${constants.TOR_PROXY_PORT}`,
);

router.get('/price', auth.jwt, async (ctx, next) => {
  // Default to USD
  const currency = (ctx.request.query.currency as string) || 'USD';
  const apiResponse = await fetch(
    `https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=${currency}`,
    {
      agent,
      method: 'GET',
    },
  );

  try {
    ctx.body = await apiResponse.json();
  } catch {
    ctx.status = STATUS_CODES.BAD_GATEWAY;
  }

  await next();
});

export default router;
