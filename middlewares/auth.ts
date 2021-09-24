import {Buffer} from 'node:buffer';
import * as passportJWT from 'passport-jwt';
import * as passportHTTP from 'passport-http';
import bcrypt from '@node-rs/bcrypt';
import Rsa from 'node-rsa';
import type {Next, Context} from 'koa';
import passport from 'koa-passport';
import * as authLogic from '../logic/auth.js';
import * as diskLogic from '../logic/disk.js';
import {STATUS_CODES} from '../utils/const.js';

const JwtStrategy = passportJWT.Strategy;
const BasicStrategy = passportHTTP.BasicStrategy;
const ExtractJwt = passportJWT.ExtractJwt;

const JWT_AUTH = 'jwt';
const REGISTRATION_AUTH = 'register';
const BASIC_AUTH = 'basic';

const SYSTEM_USER = 'admin';

const b64encode = (string: string) =>
  Buffer.from(string, 'utf-8').toString('base64');
const b64decode = (b64: string) => Buffer.from(b64, 'base64').toString('utf-8');

export async function generateJWTKeys(): Promise<void> {
  const key = new Rsa({b: 512});

  const privateKey = key.exportKey('private');
  const publicKey = key.exportKey('public');

  await diskLogic.writeJWTPrivateKeyFile(privateKey);
  await diskLogic.writeJWTPublicKeyFile(publicKey);
}

export async function createJwtOptions(): Promise<{
  jwtFromRequest: passportJWT.JwtFromRequestFunction;
  secretOrKey: string;
  algorithm: string;
}> {
  await generateJWTKeys();
  const pubKey = await diskLogic.readJWTPublicKeyFile();

  return {
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
    secretOrKey: pubKey,
    algorithm: 'RS256',
  };
}

passport.serializeUser((user, done) => {
  done(null, SYSTEM_USER);
});

passport.use(
  BASIC_AUTH,
  new BasicStrategy((username, password, next) => {
    password = b64decode(password);
    const user = {
      username: SYSTEM_USER,
      password,
      plainTextPassword: password,
    };
    next(null, user);
  }),
);

const jwtOptions = await createJwtOptions();

passport.use(
  JWT_AUTH,
  new JwtStrategy(jwtOptions, (jwtPayload, done) => {
    done(null, {username: SYSTEM_USER});
  }),
);

passport.use(
  REGISTRATION_AUTH,
  new BasicStrategy((username, password, next) => {
    password = b64decode(password);
    const credentials = authLogic.hashCredentials(password);

    next(null, credentials);
  }),
);

// Override the authorization header with password that is in the body of the request if basic auth was not supplied.
export async function convertRequestBodyToBasicAuth(
  ctx: Context,
  next: Next,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  if (ctx.request.body.password && !ctx.request.headers.authorization) {
    // We need to Base64 encode because Passport breaks on ":" characters
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const password = b64encode(ctx.request.body.password);
    ctx.request.headers.authorization =
      'Basic ' + Buffer.from(SYSTEM_USER + ':' + password).toString('base64');
  }

  await next();
}

export async function basic(ctx: Context, next: Next): Promise<void> {
  await passport.authenticate(
    BASIC_AUTH,
    {session: false},
    async (error, user) => {
      if (error || user === false) {
        ctx.throw(STATUS_CODES.UNAUTHORIZED, 'Invalid state');
      }

      try {
        const storedPassword = (await diskLogic.readUserFile()).password;
        const equal = await bcrypt.compare(
          (user as {[key: string]: unknown; password: string}).password,
          storedPassword!,
        );
        if (!equal) {
          ctx.throw(STATUS_CODES.UNAUTHORIZED, 'Incorrect password');
        }

        try {
          await ctx.logIn(user);
        } catch {
          ctx.throw(
            STATUS_CODES.INTERNAL_SERVER_ERROR,
            'Failed to log in. Your password seemed to be correct though. Please contact the Citadel support team.',
          );
        }
      } catch {
        ctx.throw(STATUS_CODES.UNAUTHORIZED, 'No user registered');
      }
    },
  )(ctx, next);
}

// eslint-enable @typescript-eslint/no-unsafe-member-access
export async function jwt(ctx: Context, next: Next): Promise<void> {
  await passport.authenticate(
    JWT_AUTH,
    {session: false},
    async (error, user) => {
      if (error || user === false) {
        ctx.throw(STATUS_CODES.UNAUTHORIZED, 'Invalid JWT');
      }

      try {
        await ctx.logIn(user);
      } catch {
        ctx.throw(
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          'An internal error occured. Please contact the Citadel support team.',
        );
      }

      await next();
    },
  )(ctx, next);
}

export async function register(ctx: Context, next: Next): Promise<void> {
  await passport.authenticate(
    REGISTRATION_AUTH,
    {session: false},
    async (error, user) => {
      if (error || user === false) {
        ctx.throw(STATUS_CODES.UNAUTHORIZED, 'Invalid state');
      }

      try {
        await ctx.logIn(user);
      } catch {
        ctx.throw(
          STATUS_CODES.INTERNAL_SERVER_ERROR,
          'An internal error occured. Please contact the Citadel support team.',
        );
      }

      await next();
    },
  )(ctx, next);
}
