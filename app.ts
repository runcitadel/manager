import {config} from 'dotenv';
import Koa, {Context} from 'koa';
import morgan from 'koa-morgan';
import bodyParser from 'koa-body';
import passport from 'koa-passport';
import cors from '@koa/cors';

import {corsOptions} from './middlewares/cors.js';

import ping from './routes/ping.js';
import account from './routes/v1/account.js';
import system from './routes/v1/system.js';
import external from './routes/v1/external.js';
import apps from './routes/v1/apps.js';

config();

const app = new Koa();

// Handles CORS
app.use(cors(corsOptions));

app.use(bodyParser());
app.use(passport.initialize());
app.use(passport.session());

app.use(morgan('combined'));

app.use(ping.routes());
app.use(account.routes());
app.use(system.routes());
app.use(external.routes());
app.use(apps.routes());

app.use(async (ctx: Context, next) => {
  try {
    await next();
  } catch (error: unknown | Error) {
    ctx.app.emit('error', error, ctx);
  }
});

app.on('error', (error: Error, ctx: Context) => {
  const route = ctx.request.URL.pathname ?? '';
  const message = error.message ?? JSON.stringify(error);
  console.warn(`[WARNING] ${message} on ${route}.`);
  console.warn(error.stack);
});

export default app;
