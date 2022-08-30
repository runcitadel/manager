import {config} from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import { Application } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import logger from "https://deno.land/x/oak_logger@1.0.0/mod.ts";

import ping from './routes/ping.ts';
import account from './routes/v1/account.ts';
import system from './routes/v1/system.ts';
import system2 from './routes/v2/system.ts';
import external from './routes/v1/external.ts';
import apps from './routes/v1/apps.ts';

config();

const app = new Application();

app.use(logger.logger);
app.use(logger.responseTime);

app.use(oakCors({ origin: "*" }));

app.use(ping.routes());

// V1 API
app.use(account.routes());
app.use(external.routes());
app.use(apps.routes());
// Unused right now
app.use(system.routes());

// V2 API for Citadel SDK
app.use(system2.routes());

app.listen("0.0.0.0:3000");
