// deno-lint-ignore-file no-explicit-any
import validator from "https://esm.sh/validator@13.7.0";
import { Context, State, Status } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { Buffer } from "https://deno.land/std@0.153.0/node/buffer.ts";

// Max length is listed here:
// https://github.com/lightningnetwork/lnd/blob/fd1f6a7bc46b1e50ff3879b8bd3876d347dbb73d/channeldb/invoices.go#L84
const MAX_MEMO_LENGTH = 1024;
const MIN_PASSWORD_LENGTH = 12;

export interface Middleware<
  S extends State = Record<string, any>,
  T extends Context = Context<S>,
> {
  (context: T, next: () => Promise<unknown>): Promise<unknown> | unknown;
}

/**
 * Checks if a string only contains alpha numeric characters
 *
 * @param string The string to check
 * @param ctx The koa context
 */
export function isAlphanumeric<
  S extends State = Record<string, any>,
  T extends Context = Context<S>,
>(string: string, ctx: T): void {
  isDefined(string, ctx);

  if (!validator.isAlphanumeric(string)) {
    ctx.throw(Status.BadRequest, "Must include only alpha numeric characters.");
  }
}

/**
 * Checks if a string only contains alpha numeric characters and spaces
 *
 * @param string The string to check
 * @param ctx The koa context
 */
export function isAlphanumericAndSpaces<
  S extends State = Record<string, any>,
  T extends Context = Context<S>,
>(string: string, ctx: T): void {
  isDefined(string, ctx);

  if (!validator.matches(string, "^[a-zA-Z0-9\\s]*$")) {
    ctx.throw(
      Status.BadRequest,
      "Must include only alpha numeric characters and spaces.",
    );
  }
}

/**
 * Checks if a value has a boolean type
 *
 * @param value The value to check
 * @param ctx The koa context
 */
export function isBoolean<
  S extends State = Record<string, any>,
  T extends Context = Context<S>,
>(value: unknown, ctx: T): void {
  if (value !== true && value !== false) {
    ctx.throw(Status.BadRequest, "Must be true or false.");
  }
}

/**
 * Converts a boolean-like string, boolean or number to a boolean and returns it.
 *
 * For numbers, true equals 1
 * @param value The string or boolean to convert
 */
export function toBoolean<
  S extends State = Record<string, any>,
  T extends Context = Context<S>,
>(value: unknown): boolean {
  switch (value) {
    case true:
    case "true":
    case 1:
      return true;
    case false:
    case "false":
    case 0:
      return false;
    default:
      throw new TypeError("Unsupported value passed to toBoolean()");
  }
}

/**
 * Checks if a value has a boolean-like type
 *
 * @param value The value to check
 * @param ctx The koa context
 */
export function isBooleanLike<
  S extends State = Record<string, any>,
  T extends Context = Context<S>,
>(value: unknown, ctx: T): void {
  if (
    value !== "true" &&
    value !== "false" &&
    value !== true &&
    value !== false
  ) {
    ctx.throw(Status.BadRequest, "Must be true or false.");
  }
}

/**
 * Checks if a string represents a decimal number
 *
 * @param string The string to check
 * @param ctx The koa context
 */
export function isDecimal<
  S extends State = Record<string, any>,
  T extends Context = Context<S>,
>(string: string, ctx: T): void {
  if (!validator.isDecimal(string)) {
    ctx.throw(Status.BadRequest, "Must be decimal.");
  }
}

/**
 * Checks if something is defined
 *
 * @param value The thing to check
 * @param ctx The koa context
 */
export function isDefined<
  S extends State = Record<string, any>,
  T extends Context = Context<S>,
>(value: unknown, ctx: T): void {
  if (value === undefined) {
    ctx.throw(Status.BadRequest, "Must define variable.");
  }
}

/**
 * Checks if a string is long enough for a password
 *
 * @param string The string to check
 * @param ctx The koa context
 */
export function isMinPasswordLength<
  S extends State = Record<string, any>,
  T extends Context = Context<S>,
>(password: string, ctx: T): void {
  if (password.length < MIN_PASSWORD_LENGTH) {
    ctx.throw(
      Status.BadRequest,
      "Must be " + MIN_PASSWORD_LENGTH + " or more characters.",
    );
  }
}

/**
 * Checks if a string or number is a positive integer
 *
 * @param string The string or number to check
 * @param ctx The koa context
 */
export function isPositiveInteger<
  S extends State = Record<string, any>,
  T extends Context = Context<S>,
>(amount: string | number, ctx: T): void {
  if (!validator.isInt(String(amount), { gt: 0 })) {
    ctx.throw(Status.BadRequest, "Must be positive integer.");
  }
}

/**
 * Checks if a string or number is a positive integer or zero
 *
 * @param string The string or number to check
 * @param ctx The koa context
 */
export function isPositiveIntegerOrZero<
  S extends State = Record<string, any>,
  T extends Context = Context<S>,
>(amount: unknown, ctx: T): void {
  if (!validator.isInt(String(amount), { gt: -1 })) {
    ctx.throw(Status.BadRequest, "Must be positive integer.");
  }
}

/**
 * Checks if a value is a string
 *
 * @param value The object to check
 * @param ctx The koa context
 */
export function isString<
  S extends State = Record<string, any>,
  T extends Context = Context<S>,
>(value: unknown, ctx: T): void {
  if (typeof value !== "string") {
    ctx.throw(Status.BadRequest, "Object must be of type string.");
  }
}

/**
 * Checks if a string has a valid length for a memo
 *
 * @param string The string to check
 * @param ctx The koa context
 */
export function isValidMemoLength<
  S extends State = Record<string, any>,
  T extends Context = Context<S>,
>(string: string, ctx: T): void {
  if (Buffer.byteLength(string, "utf8") > MAX_MEMO_LENGTH) {
    ctx.throw(
      Status.BadRequest,
      "Must be less than " + MAX_MEMO_LENGTH + " bytes.",
    );
  }
}
