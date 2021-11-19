import {Buffer} from 'node:buffer';
import {STATUS_CODES} from '@runcitadel/utils';
import * as passportJWT from 'passport-jwt';
import * as passportHTTP from 'passport-http';
import passportTOTP from "passport-totp";
import bcrypt from '@node-rs/bcrypt';
import Rsa from 'node-rsa';
import type {Next, Context} from 'koa';
import passport from 'koa-passport';
import * as authLogic from '../logic/auth.js';
import * as diskLogic from '../logic/disk.js';
import notp from 'notp';

/* eslint-disable @typescript-eslint/naming-convention */
const JwtStrategy = passportJWT.Strategy;
const BasicStrategy = passportHTTP.BasicStrategy;
const TotpStrategy = passportTOTP.Strategy;
const ExtractJwt = passportJWT.ExtractJwt;

const JWT_AUTH = 'jwt';
const JWT_AUTH_2FA = 'jwt_2fa';
const REGISTRATION_AUTH = 'register';
const BASIC_AUTH = 'basic';
const TOTP_AUTH = 'totp';

const SYSTEM_USER = 'admin';
/* eslint-enable @typescript-eslint/naming-convention */

const b64encode = (string: string) =>
  Buffer.from(string, 'utf-8').toString('base64');
const b64decode = (b64: string) => Buffer.from(b64, 'base64').toString('utf-8');

export async function generateJwtKeys(): Promise<void> {
  const key = new Rsa({b: 512});

  const privateKey = key.exportKey('private');
  const publicKey = key.exportKey('public');

  await diskLogic.writeJwtPrivateKeyFile(privateKey);
  await diskLogic.writeJwtPublicKeyFile(publicKey);
}

export async function createJwtOptions(): Promise<{
  jwtFromRequest: passportJWT.JwtFromRequestFunction;
  secretOrKey: string;
  algorithm: string;
}> {
  await generateJwtKeys();
  const pubKey = await diskLogic.readJwtPublicKeyFile();

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
    if (!jwtPayload.id || jwtPayload.id === 'temporary')
      throw new Error('Tried to use a tempoarary JWT!');
    done(null, {username: SYSTEM_USER});
  }),
);

passport.use(
  JWT_AUTH_2FA,
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


passport.use(new TotpStrategy(async function(user, done) {
  const info = await diskLogic.readUserFile();
  done(null, info.settings?.twoFactorKey || "", 30)
}));

// Override the authorization header with password that is in the body of the request if basic auth was not supplied.
export async function convertRequestBodyToBasicAuth(
  ctx: Context,
  next: Next,
): Promise<void> {
  if (ctx.request.body.password && !ctx.request.headers.authorization) {
    // We need to Base64 encode because Passport breaks on ":" characters
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
        const userInfo = await diskLogic.readUserFile();
        const storedPassword = userInfo.password;
        const equal = await bcrypt.compare(
          (user as {[key: string]: unknown; password: string}).password,
          storedPassword!,
        );
        if (!equal) {
          ctx.throw(STATUS_CODES.UNAUTHORIZED, 'Incorrect password');
        }

        // check 2FA token when enabled
        if(userInfo.settings?.twoFactorAuth) {
          let vres = notp.totp.verify(ctx.request.body.totpToken, userInfo.settings.twoFactorKey || "");

          if(!vres|| vres.delta == 0) {
            ctx.throw(STATUS_CODES.UNAUTHORIZED, 'Incorrect 2FA code');
          }
        }

        try {
          await ctx.logIn(user);
        } catch (error) {
          console.error(error);
          ctx.throw(
            STATUS_CODES.INTERNAL_SERVER_ERROR,
            'Failed to log in. Your password seemed to be correct though. Please contact the Citadel support team.',
          );
        }
      } catch {
        ctx.throw(STATUS_CODES.UNAUTHORIZED, 'No user registered');
      }

      await next();
    },
  )(ctx, next);
}

// eslint-enable @typescript-eslint/no-unsafe-member-access
export async function tempJwt(ctx: Context, next: Next): Promise<void> {
  await passport.authenticate(
    JWT_AUTH_2FA,
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
