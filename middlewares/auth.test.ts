import { setEnv } from "../utils/test.ts";
import constants from "../utils/const.ts";
import { assert } from "https://deno.land/std@0.153.0/testing/asserts.ts";
import {
    exists,
  } from "https://deno.land/std@0.153.0/fs/mod.ts";
setEnv();

Deno.test("JWT pubkeys are automatically generated", async () => {
    await Deno.remove(constants.JWT_PUBLIC_KEY_FILE);
    await Deno.remove(constants.JWT_PRIVATE_KEY_FILE);
    await import("./auth.ts");
    assert(await exists(constants.JWT_PUBLIC_KEY_FILE));
    assert(await exists(constants.JWT_PRIVATE_KEY_FILE));
});
