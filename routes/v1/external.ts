import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";

import constants from "../../utils/const.ts";
import * as auth from "../../middlewares/auth.ts";

const router = new Router({
  prefix: "/v1/external",
});

const tor = Deno.createHttpClient({
  proxy: {
    url: `socks5h://${constants.TOR_PROXY_IP}:${constants.TOR_PROXY_PORT}`,
  },
});

router.get("/price", auth.jwt, async (ctx, next) => {
  const currency = ctx.request.url.searchParams.get("currency") || "USD";
  // btc-price.deno.dev is maintained by the Citadel team and manages automatic source choosing,
  // so if any third party API ever goes down, we can just change it server-side
  const price = await fetch(
    `https://btc-price.deno.dev/?currency=${currency}`,
    {
      client: tor,
    }
  );
  ctx.response.body = {};
  (ctx.response.body as Record<string, number>)[currency] = parseFloat(await price.text());
  await next();
});

export default router;
