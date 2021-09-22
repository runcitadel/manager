import Router from '@koa/router';
import pjson from '../package.json';

const router = new Router();

router.get('/', async (ctx, next) => {
  ctx.body = {version: 'manager-' + pjson.version};
  await next();
});

export default router;
