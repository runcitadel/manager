import Router from '@koa/router';

const router = new Router({
  prefix: '/ping',
});

router.get('/', async (ctx, next) => {
  ctx.body = {
    version: 'Citadel Manager',
  };
  await next();
});

export default router;
