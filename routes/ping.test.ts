import ping from "./ping.ts";
import { assert } from "https://deno.land/std@0.153.0/testing/asserts.ts";
import { routerToSuperDeno } from "../utils/test.ts";

Deno.test("It correctly responds to a ping", async () => {
    const app = await routerToSuperDeno(ping);
    const response = await app.get("/ping");
    assert(response.ok);
    assert(response.body.isCitadel);
    assert(Array.isArray(response.body.features));
});
