import {
  FakeKaren,
  routerToSuperDeno,
  setEnv,
  test,
} from "../../utils/test.ts";
import { assert } from "https://deno.land/std@0.159.0/testing/asserts.ts";

setEnv();

const account = (await import("./account.ts")).default;

const karen = new FakeKaren();

Deno.test("Login with valid password works", async () => {
  await karen.start();
  const app = await routerToSuperDeno(account);
  const response = await app
    .post("/v1/account/login")
    .set("Content-Type", "application/json")
    .send('{"password":"password1234"}');
  await karen.stop();
  assert(response.ok, "Response should return status 200");
  assert(
    typeof response.body.jwt === "string",
    "JWT should be present and a string"
  );
});

test("Login with invalid password fails", {
  router: account,
  method: "POST",
  url: "/v1/account/login",
  expectedStatus: 401,
  expectedData: "Incorrect password",
  body: { password: "password12345" },
});

test("Can get the seed with valid password", {
  router: account,
  method: "POST",
  url: "/v1/account/seed",
  expectedStatus: 200,
  expectedData: {
    seed: ["this", "is", "the", "seed"],
  },
  body: { password: "password1234" },
});

Deno.test("/registered returns true if user file exists", async () => {
  const app = await routerToSuperDeno(account);
  const response = await app.get("/v1/account/registered").send();
  assert(response.ok, "Response should return status 200");
  assert(response.body.registered);
});

Deno.test(
  "Password change fails with password which is too short",
  async () => {
    await karen.start();
    const app = await routerToSuperDeno(account);
    const response = await app
      .post("/v1/account/change-password")
      .set("Content-Type", "application/json")
      .send('{"password":"password1234", "newPassword": "password123"}');
    await karen.stop();
    assert(response.status === 400, "Response should return status 400");
  }
);

test("Password change fails passwords are the same", {
  router: account,
  method: "POST",
  url: "/v1/account/change-password",
  expectedStatus: 400,
  expectedData: "The new password must not be the same as existing password",
  body: { password: "password1234", newPassword: "password1234" },
});

test("Password change fails if new password is missing", {
  router: account,
  method: "POST",
  url: "/v1/account/change-password",
  expectedStatus: 400,
  expectedData: "Received invalid data.",
  body: { password: "password1234" },
});

test("Password change fails if new password is an object", {
  router: account,
  method: "POST",
  url: "/v1/account/change-password",
  expectedStatus: 400,
  expectedData: "Received invalid data.",
  body: { password: "password1234", newPassword: { value: "password12345" } },
});

test("Password change works with valid password", {
  router: account,
  method: "POST",
  url: "/v1/account/change-password",
  expectedStatus: 200,
  expectedData: { percent: 100 },
  body: { password: "password1234", newPassword: "password12345" },
  expectedKarenMessages: ["trigger change-password"]
});

test("Password change progress always returns 100% for backwards compat", {
  router: account,
  method: "GET",
  url: "/v1/account/change-password/status",
  expectedStatus: 200,
  expectedData: { percent: 100 },
  includeJwt: true,
});

test("getinfo returns valid data", {
  router: account,
  method: "GET",
  url: "/v1/account/info",
  expectedStatus: 200,
  expectedData: { name: "Tester with password password123", installedApps: ["example-app"] },
  includeJwt: true,
});
