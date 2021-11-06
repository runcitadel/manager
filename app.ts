import {config} from 'dotenv';

import Koa, {Context} from 'koa';
import morgan from 'koa-morgan';
import bodyParser from 'koa-body';
import passport from 'koa-passport';
import cors from '@koa/cors';

import {errorHandler, corsOptions} from '@runcitadel/utils';

import ping from './routes/ping.js';
import account from './routes/v1/account.js';
import system from './routes/v1/system.js';
import system2 from './routes/v2/system.js';
import external from './routes/v1/external.js';
import apps from './routes/v1/apps.js';

// Unstable V3 API with multi-account support
/*import account3 from './routes/v3/account.js';
import system3 from './routes/v3/system.js';
import apps3 from './routes/v3/apps.js';*/

config();

const app = new Koa();

app.use(errorHandler);

app.on('error', (error: Error, ctx: Context) => {
  const route = ctx.request.URL.pathname ?? '';
  const message = error.message ?? JSON.stringify(error);
  console.warn(`[WARNING] ${message} on ${route}.`);
  console.warn(error.stack);
});

// Handles CORS
app.use(cors(corsOptions));

app.use(bodyParser());
app.use(passport.initialize());
app.use(passport.session());

app.use(morgan('combined'));

app.use(ping.routes());

// V1 API used by the old dashboard
app.use(account.routes());
app.use(system.routes());
app.use(external.routes());
app.use(apps.routes());

// V2 API for Citadel SDK
app.use(system2.routes());

// Unstable V3 API with multi-account support
/*app.use(account3.routes());
app.use(system3.routes());
app.use(apps3.routes());*/

export default app;
