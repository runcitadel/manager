import { config } from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import {
  Application,
  FlashServer,
  hasFlash,
} from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import logger from "https://deno.land/x/oak_logger@1.0.0/mod.ts";

import ping from "./routes/ping.ts";
import account from "./routes/v1/account.ts";
import system from "./routes/v1/system.ts";
import system2 from "./routes/v2/system.ts";
import external from "./routes/v1/external.ts";
import apps from "./routes/v1/apps.ts";

config();
const appOptions = hasFlash() ? { serverConstructor: FlashServer } : undefined;

const app = new Application(appOptions);


app.use(logger.logger);
app.use(logger.responseTime);

app.use(oakCors({ origin: "*" }));

// Handle errors
app.use(async ({response}, next) => {
  try {
    await next();
  // deno-lint-ignore no-explicit-any
  } catch (err: any) {
    response.status = err.status || 500;
    response.body = err.message;
  }
});

app.use(ping.routes());
app.use(ping.allowedMethods());

// V1 API
app.use(account.routes());
app.use(account.allowedMethods());
app.use(external.routes());
app.use(external.allowedMethods());
app.use(apps.routes());
app.use(apps.allowedMethods());
// Unused right now
app.use(system.routes());
app.use(system.allowedMethods());

// V2 API for Citadel SDK
app.use(system2.routes());
app.use(system2.allowedMethods());

app.listen("0.0.0.0:3000");
