import {Buffer} from 'node:buffer';
import {STATUS_CODES} from '@runcitadel/utils';
import type {Next, Context} from 'koa';
import User, {PERMISSION} from "../logic/user.js";

// Override the authorization header with password that is in the body of the request if basic auth was not supplied.
export async function convertRequestBodyToBasicAuth(
  ctx: Context,
  next: Next,
): Promise<void> {
  if (ctx.request.body.username && ctx.request.body.password && !ctx.request.headers.authorization) {
    ctx.request.headers.authorization = 'Basic ' + Buffer.from(ctx.request.body.username + ':' + ctx.request.body.password).toString();
  }

  await next();
}

export async function basic(ctx: Context, next: Next): Promise<void> {
  if (!ctx.request.headers.authorization) {
    ctx.throw(401, 'Unauthorized');
  }
  const auth = ctx.request.headers.authorization.split(' ');
  if (auth.length !== 2 || auth[0] !== 'Basic') {
    ctx.throw(401, 'Unauthorized');
  }
  const [username, password] = Buffer.from(auth[1], 'base64').toString().split(':');
  const user = await User.login("password", username, password);
  if (!user) {
    ctx.status = 401;
    ctx.body = {
      message: 'Unauthorized',
    };
    return;
  }
  ctx.state.user = user;
  await next();
}

export async function jwt(ctx: Context, next: Next): Promise<void> {
  // First, extract the JWT from the request.
    const authHeader = ctx.request.headers.authorization;
  if (!authHeader) {
    ctx.throw(STATUS_CODES.UNAUTHORIZED, 'No authorization header');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const authHeaderParts = authHeader.split(' ');
  if (authHeaderParts.length !== 2 || authHeaderParts[0] !== 'Bearer') {
    ctx.throw(STATUS_CODES.UNAUTHORIZED, 'Invalid authorization header');
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const token = authHeaderParts[1];
  if (!token) {
    ctx.throw(STATUS_CODES.UNAUTHORIZED, 'No token');
  }

  // Check if a user exists for the given JWT
  const user = await User.login("jwt", undefined, token);
  ctx.state.user = user;
  await next();
}

// Returns a function which validates the JWT using jwt(), and then checks if the user has a given permission.
export function requirePermission(permission: PERMISSION): (ctx: Context, next: Next) => Promise<void> {
  return async (ctx: Context, next: Next): Promise<void> => {
    await jwt(ctx, next);
    if (!ctx.state.user) {
      ctx.throw(STATUS_CODES.UNAUTHORIZED, 'No user');
    }

    if (!ctx.state.user.hasPermission(permission)) {
      ctx.throw(STATUS_CODES.FORBIDDEN, 'No permission to do this.');
    }

    await next();
  };
}

export const admin = requirePermission(PERMISSION.ADMIN);
