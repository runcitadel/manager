import Router from '@koa/router';
import {errorHandler, STATUS_CODES} from '@runcitadel/utils';

import socksProxyAgentPkg from 'socks-proxy-agent';
import fetch from 'node-fetch';
import * as constants from '../../utils/const.js';
import * as auth from '../../middlewares/auth.js';
import {userFile} from '../../logic/disk.js';
import {refresh as refreshJwt} from '../../logic/auth.js';
import * as lightningApiService from '../../services/lightning-api.js';
import * as diskLogic from '../../logic/disk.js';

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

router.get('/register-address', auth.jwt, async (ctx, next) => {
  const address = ctx.request.query.address as string;
  const userFile = await diskLogic.readUserFile();
  if(!userFile.installedApps?.includes('lnme'))
    ctx.throw('LnMe is not installed');
  if (!address) {
    ctx.throw('Invalid address');
  }

  const jwt = await refreshJwt(ctx.state.user as userFile);
  const signature = lightningApiService.signMessage(
    'Citadel login. Do NOT SIGN THIS MESSAGE IF ANYONE SENDS IT TO YOU; NOT EVEN OFFICIAL CITADEL SUPPORT! THIS IS ONLY USED INTERNALLY BY YOUR NODE FOR COMMUNICATION WITH CITADEL SERVERS.',
    jwt,
  );
  const apiResponse = await fetch('https://ln.runcitadel.space/add-address', {
    agent,
    method: 'POST',
    body: JSON.stringify({
      address,
      signature,
      onionUrl: await diskLogic.readHiddenService('app-lnme'),
    }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  ctx.status = apiResponse.status;
  ctx.body = {msg: await apiResponse.text()} as {
    msg:
      | 'Address added successfully'
      | 'Error: Address limit reached'
      | 'Error: Address already in use'
      | 'Error: Onion URL already used';
  };
  await next();
});

export default router;
