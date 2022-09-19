import { Context, State, Status } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import * as typeHelper from "./types.ts";

export async function getPasswordFromContext<
  // deno-lint-ignore no-explicit-any
  S extends State = Record<string, any>,
  T extends Context = Context<S>,
>(ctx: T): Promise<string> {
  let reqPassword = ctx.request.headers.get("Authorization")?.split(" ")[1];
  try {
    const body = await ctx.request.body({
      type: "json",
    }).value;
    reqPassword = body.password || reqPassword;
  } catch {
    // Allow failure
  }
  if (!reqPassword) {
    ctx.throw(Status.BadRequest, '"Missing authorization header"');
  }
  typeHelper.isString(reqPassword, ctx);
  return reqPassword as string;
}
