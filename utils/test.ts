import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import {
  SuperDeno,
  superoak,
  Test,
} from "https://deno.land/x/superoak@4.7.0/mod.ts";
import { join } from "https://deno.land/std@0.153.0/path/mod.ts";
import constants from "../utils/const.ts";
import { writeStatusFile, writeUserFile } from "../logic/disk.ts";
import { assertEquals } from "https://deno.land/std@0.153.0/testing/asserts.ts";
import { generateJwt } from "./jwt.ts";

export function routerToSuperDeno(router: Router): Promise<SuperDeno> {
  const app = new Application();
  app.use(async ({ response }, next) => {
    try {
      await next();
      // deno-lint-ignore no-explicit-any
    } catch (err: any) {
      response.status = err.status || 500;
      response.body = JSON.stringify(err.message || err);
      response.headers.set("content-type", "application/json");
    }
  });
  app.use(router.routes());
  app.use(router.allowedMethods());
  return superoak(app);
}

export function setEnv(citadelOs = false) {
  const currentPath = new URL(import.meta.url).pathname;
  const fixturesDir = join(currentPath, "..", "..", "fixtures");
  Deno.env.set("USER_FILE", join(fixturesDir, "user.json"));
  Deno.env.set("KAREN_SOCKET", join(fixturesDir, "karen"));
  Deno.env.set("STATUS_DIR", join(fixturesDir, "statuses"));
  Deno.env.set("APPS_DIR", join(fixturesDir, "apps"));
  Deno.env.set("TOR_HIDDEN_SERVICE_DIR", join(fixturesDir, "tor"));
  Deno.env.set("JWT_PUBLIC_KEY_FILE", join(fixturesDir, "publicKey.pem"));
  Deno.env.set("JWT_PRIVATE_KEY_FILE", join(fixturesDir, "privateKey.pem"));
  Deno.env.set("SEED_FILE", join(fixturesDir, "citadel-seed"));
  Deno.env.set("LND_CERT_FILE", join(fixturesDir, "tls.cert"));
  Deno.env.set("LND_ADMIN_MACAROON_FILE", join(fixturesDir, "admin.macaroon"));
  Deno.env.set("GITHUB_BRANCH", "stable");
  Deno.env.set("VERSION_FILE", join(fixturesDir, "info.json"));
  /*const TOR_PROXY_IP = Deno.env.get("TOR_PROXY_IP") || "192.168.0.1";
  const TOR_PROXY_PORT =
    Number.parseInt(Deno.env.get("TOR_PROXY_PORT") || "9050", 10) || 9050;*/
  if (citadelOs) {
    Deno.env.set("IS_CITADEL_OS", "true");
  }
}

export async function cleanup() {
  const standardUserFile = {
    name: "Tester with password password123",
    password: "$2a$10$XOWhRrdr.s6UZi.U5uwS5eY04P9HD4qjHcj8Ofck5sxx5tiICP5y6",
    seed: "v4i4eoHmr5Wa1V6RLiXfw0qMzoJZUYj/Wf24HIw0p2Q=$6ab24c0706b26e3ff566d116b2c1b065$0/xFZcU29uMo$b7be1e091cea58521d75004a79862204c84e35150822d9c1972f22c6f74a4f5b$250000$cbc",
    installedApps: ["example-app"],
  };
  await writeUserFile(standardUserFile);
  await writeStatusFile("password", "password1234");
}

export class FakeKaren {
  #isRunning = false;
  #connection: Deno.Listener | null = null;
  #connections: Deno.Conn[] = [];
  async start(): Promise<void> {
    if (this.#isRunning) {
      throw new Error("Karen is already running");
    }
    this.#isRunning = true;
    this.#connection = await Deno.listen({
      path: constants.KAREN_SOCKET,
      transport: "unix",
    });
    // This will never end until stop() is called, so do not await it
    this.#keepListening();
  }

  async #keepListening() {
    while (this.#isRunning) {
      try {
        const connection = (await this.#connection?.accept()) as Deno.Conn;
        if (connection) this.#connections.push(connection);
      } catch (err) {
        if (this.#isRunning) {
          throw err;
        }
      }
    }
  }

  async stop() {
    this.#isRunning = false;
    for (const connection of this.#connections) {
      connection.close();
    }
    this.#connections = [];
    await this.#connection?.close();
    await Deno.remove(constants.KAREN_SOCKET);
  }
}

export function test(
  name: string,
  {
    router,
    method,
    url,
    expectedStatus,
    expectedData,
    body,
    includeJwt,
  }: {
    router: Router;
    method: "GET" | "POST" | "PUT";
    url: string;
    expectedStatus: number;
    expectedData?: unknown;
    body?: unknown;
    includeJwt?: boolean;
  }
) {
  return Deno.test(name, async () => {
    setEnv();
    const karen = new FakeKaren();
    await karen.start();
    const app = await routerToSuperDeno(router);
    let req: Test;
    if (method == "GET") {
      req = app.get(url);
      if (body) throw new TypeError("Get can't have a body!");
    } else if (method == "POST") {
      req = app.post(url);
    } else if (method === "PUT") {
      req = app.put(url);
    } else {
      throw new Error("Method not supported by the wrapper function");
    }
    if (includeJwt)
      req.set("Authorization", `Bearer ${await generateJwt("admin")}`);
    if (body) {
      req.set("Content-Type", "application/json");
    }
    const response = await req.send(body ? JSON.stringify(body) : undefined);
    await karen.stop();
    await cleanup();
    assertEquals(
      response.status,
      expectedStatus
    );
    if (expectedData)
      assertEquals(
        JSON.parse(response.text),
        expectedData
      );
  });
}
