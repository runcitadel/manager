import { Application, Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import {
  SuperDeno,
  superoak,
  Test,
} from "https://deno.land/x/superoak@4.7.0/mod.ts";
import { join } from "https://deno.land/std@0.153.0/path/mod.ts";
import constants from "../utils/const.ts";
import {
  writeJwtPrivateKeyFile,
  writeJwtPublicKeyFile,
  writeStatusFile,
  writeUserFile,
} from "../logic/disk.ts";
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
      if (response.status >= 500) {
        console.log(err.message || err);
      }
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
  await writeJwtPublicKeyFile(`-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAgbjIPXqWlp8tlBxkJF7B
tFiG0qzw4+/WHjLJF9MQRPxro3m80sZDd5cfBUp76P+pXWaDO5kAhI55nK/er/0V
WujURV1caWkSr0PQHAYuMSni3asn1+PoKbYFVyLnlUYPzgZayQ+DtAHTn5cNVY/Z
tInz03MteAqOnpa1Sh8S4dcyECH8ouqvP1C2b7GJRMkra8Ay/87Tpacgr5G9ptTg
7Ig+EpFQSwo078H9scADgs/ejwx0A5R9HI5VPCEP6tduQRGtHJ6Ih9z7rcOK8NRj
lVESM13bK5C5PEB5qMAHYuNxFzAMlLZlxOVFchOjgUY97VQaeTOCQFUEfpBnUrDY
QDCjVvMT6x/lype+U4+vqZOA4FWDfJE79bTVvekQKuuOySgR1gncbZiophP/SSA0
U5AHtLxMJr5d/EnNwwvqYQwtn9FJ3kfkslUT+XUf651uoOzLvxvw5cEGG+Of+mmB
uopMYXzZ3fB9E09g+hY9khOtUEoghC1QD7c4RHQHDX1Dptoa0+rT1a4wtHQR/jgG
9rurKk2U/TxWVi0Xt8wlqXq/OWKS9pdIvUcq5L8KmLwGcvx0pJ5ZVT5+nY1vsQVE
V8CcB8GSMgyxwGJm0GnxF5J3WJW2WrhFjlE5V2ue7iSmxEwOUh0qaq/cIU7gM5Uv
NArZ73xO2zfBQBUl/0pkfaECAwEAAQ==
-----END PUBLIC KEY-----`);
  await writeJwtPrivateKeyFile(`-----BEGIN RSA PRIVATE KEY-----
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
-----END RSA PRIVATE KEY-----`);
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
    assertEquals(response.status, expectedStatus);
    if (expectedData) assertEquals(JSON.parse(response.text), expectedData);
  });
}
