import passport from "passport";
import * as passportJWT from "passport-jwt";
import * as passportHTTP from "passport-http";
import * as bcrypt from "bcrypt";
import * as diskLogic from "../logic/disk.js";
import * as authLogic from "../logic/auth.js";
import { NodeError } from "@runcitadel/utils";
import rsa from "node-rsa";
import { NextFunction, Request, Response } from "express";
import type { user as userFile } from "@runcitadel/utils";

const JwtStrategy = passportJWT.Strategy;
const BasicStrategy = passportHTTP.BasicStrategy;
const ExtractJwt = passportJWT.ExtractJwt;

const JWT_AUTH = "jwt";
const REGISTRATION_AUTH = "register";
const BASIC_AUTH = "basic";

const SYSTEM_USER = "admin";

const b64encode = (string: string) =>
  Buffer.from(string, "utf-8").toString("base64");
const b64decode = (b64: string) => Buffer.from(b64, "base64").toString("utf-8");

export async function generateJWTKeys(): Promise<void> {
  const key = new rsa({ b: 512 }); // eslint-disable-line id-length

  const privateKey = key.exportKey("private");
  const publicKey = key.exportKey("public");

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
    jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("jwt"),
    secretOrKey: pubKey,
    algorithm: "RS256",
  };
}

passport.serializeUser((user, done) => {
  return done(null, SYSTEM_USER);
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
    return next(null, user);
  })
);

createJwtOptions().then((data) => {
  const jwtOptions = data;

  passport.use(
    JWT_AUTH,
    new JwtStrategy(jwtOptions, (jwtPayload, done) => {
      return done(null, { username: SYSTEM_USER });
    })
  );
});

passport.use(
  REGISTRATION_AUTH,
  new BasicStrategy((username, password, next) => {
    password = b64decode(password);
    const credentials = authLogic.hashCredentials(password);

    return next(null, credentials);
  })
);

// Override the authorization header with password that is in the body of the request if basic auth was not supplied.
export function convertReqBodyToBasicAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.body.password && !req.headers.authorization) {
    // We need to Base64 encode because Passport breaks on ":" characters
    const password = b64encode(req.body.password);
    req.headers.authorization =
      "Basic " + Buffer.from(SYSTEM_USER + ":" + password).toString("base64");
  }

  next();
}

export function basic(req: Request, res: Response, next: NextFunction): void {
  passport.authenticate(BASIC_AUTH, { session: false }, (error, user) => {
    function handleCompare(equal: boolean) {
      if (!equal) {
        return next(new NodeError("Incorrect password", 401)); // eslint-disable-line no-magic-numbers
      }
      req.logIn(user, (error_) => {
        if (error_) {
          return next(new NodeError("Unable to authenticate", 401)); // eslint-disable-line no-magic-numbers
        }

        return (<(error: unknown, user: unknown) => void>next)(null, user);
      });
    }

    if (error || user === false) {
      return next(new NodeError("Invalid state", 401)); // eslint-disable-line no-magic-numbers
    }

    diskLogic
      .readUserFile()
      .then((userData: userFile) => {
        const storedPassword = userData.password;

        bcrypt
          .compare(user.password, <string>storedPassword)
          .then(handleCompare)
          .catch(next);
      })
      .catch(() => next(new NodeError("No user registered", 401))); // eslint-disable-line no-magic-numbers
  })(req, res, next);
}

export function jwt(request: Request, res: Response, next: NextFunction): void {
  passport.authenticate(JWT_AUTH, { session: false }, (error, user) => {
    if (error || user === false) {
      return next(new NodeError("Invalid JWT", 401)); // eslint-disable-line no-magic-numbers
    }

    request.logIn(user, (error_) => {
      if (error_) {
        return next(new NodeError("Unable to authenticate", 401)); // eslint-disable-line no-magic-numbers
      }

      return (<(error: unknown, user: unknown) => void>next)(null, user);
    });
  })(request, res, next);
}

export async function accountJWTProtected(
  request: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const isRegistered = await authLogic.isRegistered();
  if (isRegistered) {
    passport.authenticate(JWT_AUTH, { session: false }, (error, user) => {
      if (error || user === false) {
        return next(new NodeError("Invalid JWT", 401)); // eslint-disable-line no-magic-numbers
      }

      request.logIn(user, (error_: Error) => {
        if (error_) {
          return next(new NodeError("Unable to authenticate", 401)); // eslint-disable-line no-magic-numbers
        }

        return (<(error: unknown, user: unknown) => void>next)(null, user);
      });
    })(request, res, next);
  } else {
    return (<(error: unknown, user: unknown) => void>next)(
      null,
      "not-registered"
    );
  }
}

export function register(
  request: Request,
  res: Response,
  next: NextFunction
): void {
  passport.authenticate(
    REGISTRATION_AUTH,
    { session: false },
    (error, user) => {
      if (error || user === false) {
        return next(new NodeError("Invalid state", 401)); // eslint-disable-line no-magic-numbers
      }

      request.logIn(user, (error_) => {
        if (error_) {
          return next(new NodeError("Unable to authenticate", 401)); // eslint-disable-line no-magic-numbers
        }

        return (<(error: unknown, user: unknown) => void>next)(null, user);
      });
    }
  )(request, res, next);
}
