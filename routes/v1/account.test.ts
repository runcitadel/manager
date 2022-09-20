import { FakeKaren, routerToSuperDeno, setEnv } from "../../utils/test.ts";
import account from "./account.ts";
import {
  assert,
  assertFalse,
} from "https://deno.land/std@0.153.0/testing/asserts.ts";
import { assertEquals } from "https://deno.land/std@0.152.0/testing/asserts.ts";

setEnv();

const karen = new FakeKaren();
Deno.test("Login with valid password works", async () => {
  await karen.start();
  const app = await routerToSuperDeno(account);
  const response = await app.post("/v1/account/login").set(
    "Content-Type",
    "application/json",
  )
    .send('{"password":"password123"}');
  await karen.stop();
  assert(response.ok, "Response should return status 200");
  assert(
    typeof response.body.jwt === "string",
    "JWT should be present and a string",
  );
});

Deno.test("Login with invalid password fails", async () => {
  await karen.start();
  const app = await routerToSuperDeno(account);
  const response = await app.post("/v1/account/login").set(
    "Content-Type",
    "application/json",
  )
    .send('{"password":"Invalid password"}');
  await karen.stop();
  assertEquals(response.statusCode, 401, "Response should return status 401");
  const error = JSON.parse(response.text);
  assertEquals(
    error,
    "Incorrect password",
    "It should return an 'Incorrect password' message",
  );
});

Deno.test("Can get the seed with valid password", async () => {
  const app = await routerToSuperDeno(account);
  const response = await app.post("/v1/account/seed").set(
    "Content-Type",
    "application/json",
  )
    .send('{"password":"password123"}');
  assert(response.ok, "Response should return status 200");
  assertEquals(
    response.body.seed,
    ["this", "is", "the", "seed"],
    "It should return the correct seed from user.json",
  );
});

Deno.test("Can't get the seed with valid password", async () => {
  const app = await routerToSuperDeno(account);
  const response = await app.post("/v1/account/seed").set(
    "Content-Type",
    "application/json",
  )
    .send('{"password":"Invalid password"}');
  assertFalse(response.ok);
  const error = JSON.parse(response.text);
  assertEquals(error, "Incorrect password");
});

Deno.test("/registered returns true if user file exists", async () => {
  const app = await routerToSuperDeno(account);
  const response = await app.get("/v1/account/registered").send();
  assert(response.ok, "Response should return status 200");
  assert(response.body.registered);
});
