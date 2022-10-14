import { Middleware } from "https://deno.land/x/citadel@v0.5.3/mod.ts";

const lnapiUrl = Deno.env.get("MIDDLEWARE_API_URL") || "http://localhost";
const lnapiPort = Deno.env.get("MIDDLEWARE_API_PORT") || 3005;
const middleware = new Middleware(`${lnapiUrl}:${lnapiPort}`);

export async function initializeWallet(
  seed: string[],
  jwt: string,
): Promise<void> {
  middleware.jwt = jwt;
  await middleware.lightning.wallet.init(seed);
}
