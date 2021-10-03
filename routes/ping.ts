import Router from '@koa/router';

const router = new Router({
  prefix: '/ping',
});

router.get('/', async (ctx, next) => {
  ctx.body = {
    version: 'Manager by Citadel',
    // This will later be used to check for features
    features: [],
    isCitadel: true,
  };
  await next();
});

export default router;
