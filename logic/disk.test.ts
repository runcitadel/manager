import * as diskLogic from "./disk.ts";
import { assertEquals, assertThrows, assertFalse } from "https://deno.land/std@0.159.0/testing/asserts.ts";
import { exists } from "https://deno.land/std@0.159.0/fs/exists.ts";
import { setEnv, cleanup } from "../utils/test.ts";
import consts from "../utils/const.ts";

setEnv();

Deno.test("getRandomString() returns a string for an even length argument", () => {
    const randomString = diskLogic.getRandomString(8);
    assertEquals(typeof randomString, "string");
    assertEquals(randomString.length, 8);
});

Deno.test("getRandomString() fails with a not even length argument", () => {
    assertThrows(() => diskLogic.getRandomString(9));
});

Deno.test("User file can be deleted sucessfully", async () => {
    await diskLogic.deleteUserFile();
    assertFalse(await exists(consts.USER_FILE));
    await cleanup();
});
