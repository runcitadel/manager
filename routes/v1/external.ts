import { Router, Status } from "https://deno.land/x/oak@v11.1.0/mod.ts";

import * as auth from "../../middlewares/auth.ts";

const router = new Router({
  prefix: "/v1/external",
});

async function getPrice(currency = "USD") {
  try {
    const apiResponse = await fetch(
      `https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=${currency}`);
    const data = await apiResponse.json();
    return data[currency];
  } catch {
    try {
      const coinBaseApiResponse = await fetch(
        `https://api.coinbase.com/v2/prices/spot?currency=${currency}`
      );
      const parsedResponse = await coinBaseApiResponse.json();
      return parsedResponse.data.amount;
    } catch {
      return false;
    }
  }
}

router.get("/price", auth.jwt, async (ctx, next) => {
  const currency = ctx.request.url.searchParams.get("currency") || "USD";
  const price = await getPrice(currency);
  if (price) {
    ctx.response.body = {} as Record<string, number>;
    (ctx.response.body as Record<string, unknown>)[currency] = price;
  } else {
    ctx.response.status = Status.BadGateway;
  }
  await next();
});

export default router;
