import Router from '@koa/router';
import {errorHandler, STATUS_CODES} from '@runcitadel/utils';

import socksProxyAgentPkg from 'socks-proxy-agent';
import fetch from 'node-fetch';
import * as constants from '../../utils/const.js';
import * as auth from '../../middlewares/auth.js';

const router = new Router({
  prefix: '/v1/external',
});
// eslint-disable-next-line @typescript-eslint/naming-convention
const {SocksProxyAgent} = socksProxyAgentPkg;

const agent = new SocksProxyAgent(
  `socks5h://${constants.TOR_PROXY_IP}:${constants.TOR_PROXY_PORT}`,
);

router.use(errorHandler);

router.get('/price', auth.jwt, async (ctx, next) => {
  // This requires authentication, so don't remove that, then there's no SSRF
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
    try {
      const coinBaseApiResponse = await fetch(
        `https://api.coinbase.com/v2/prices/spot?currency=${currency}`,
        {
          agent,
          method: 'GET',
        },
      );
      ctx.body = {};
      (ctx.body as Record<string, unknown>)[currency] = (
        (await coinBaseApiResponse.json()) as {
          data: {base: string; currency: string; amount: number};
        }
      ).data.amount;
    } catch {
      ctx.status = STATUS_CODES.BAD_GATEWAY;
    }
  }

  await next();
});

export default router;
