// deno-lint-ignore-file no-explicit-any
import validator from "npm:validator";
import { Context, State, Status } from "https://deno.land/x/oak@v11.1.0/mod.ts";

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

type BuildPowersOf2LengthArrays<
  N extends number,
  R extends never[][],
> = R[0][N] extends never
  ? R
  : BuildPowersOf2LengthArrays<N, [[...R[0], ...R[0]], ...R]>;

type ConcatLargestUntilDone<
  N extends number,
  R extends never[][],
  B extends never[],
> = B['length'] extends N
  ? B
  : [...R[0], ...B][N] extends never
  ? ConcatLargestUntilDone<
      N,
      R extends [R[0], ...infer U] ? (U extends never[][] ? U : never) : never,
      B
    >
  : ConcatLargestUntilDone<
      N,
      R extends [R[0], ...infer U] ? (U extends never[][] ? U : never) : never,
      [...R[0], ...B]
    >;

type Replace<R extends unknown[], T> = {[K in keyof R]: T};

type TupleOf<T, N extends number> = number extends N
  ? T[]
  : {
      [K in N]: BuildPowersOf2LengthArrays<K, [[never]]> extends infer U
        ? U extends never[][]
          ? Replace<ConcatLargestUntilDone<K, U, []>, T>
          : never
        : never;
    }[N];

export type RangeOf<N extends number> = Partial<TupleOf<unknown, N>>['length'];

export type RangeOf2<From extends number, To extends number> =
  | Exclude<RangeOf<To>, RangeOf<From>>
  | From;

/** An update status file */
export type updateStatus = {
  state: 'installing' | 'success' | 'failed';
  progress: RangeOf2<0, 100>;
  description: string;
  updateTo?: string;
};

export type versionFile = {
  version: string;
  name: string;
  requires: string;
  notes: string;
};

export type backupStatus = {
  status: 'success' | 'failed';
  /** A unix timestamp of when the backup was created */
  timestamp: number;
};

export type debugStatus = {
  status: 'requested' | 'processing' | 'success';
  debug: string | null;
  /** The dmesg logs */
  dmesg: string | null;
};

export type systemStatus = {
  status: 'requested';
  type: 'reboot' | 'shutdown';
};
