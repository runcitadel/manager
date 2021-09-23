import * as process from 'node:process';
import jwt from 'jsonwebtoken';
import type {VerifyErrors} from 'jsonwebtoken';
import * as diskLogic from '../logic/disk.js';

const {sign, verify} = jwt;

async function isValidJWT(payload: string, pubkey: string): Promise<boolean> {
  return new Promise((resolve) => {
    verify(payload, pubkey, (error: VerifyErrors | null) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// Environmental variables are strings, the expiry will be interpreted as milliseconds if not converted to int.
const expiresIn = process.env.JWT_EXPIRATION
  ? Number.parseInt(process.env.JWT_EXPIRATION, 10)
  : 3600;

export async function generateJWT(account: string): Promise<string> {
  const jwtPrivateKey = await diskLogic.readJWTPrivateKeyFile();

  const jwtPubKey = await diskLogic.readJWTPublicKeyFile();

  const token = sign({id: account}, jwtPrivateKey, {
    expiresIn,
    algorithm: 'RS256',
  });

  if (!(await isValidJWT(token, jwtPubKey))) {
    return Promise.reject(new Error('Error generating JWT token.'));
  }

  return token;
}
