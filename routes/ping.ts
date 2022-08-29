import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";

const router = new Router({
  prefix: "/ping",
});


router.get('/', async (ctx, next) => {
  ctx.response.body = {
    version: 'Manager by Citadel',
    // This will later be used to check for features
    features: [],
    isCitadel: true,
  };
  await next();
});

export default router;
