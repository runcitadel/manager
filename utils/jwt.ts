import * as process from 'node:process';
import jwt from 'jsonwebtoken';
import type {VerifyErrors} from 'jsonwebtoken';
import * as diskLogic from '../logic/disk.js';

const {sign, verify} = jwt;

export async function getIdFromJwt(payload: string): Promise<string> {
  const pubkey = await diskLogic.readJwtPublicKeyFile();
  return new Promise((resolve, reject) => {
    verify(
      payload,
      pubkey,
      (error: VerifyErrors | undefined, decoded: unknown) => {
        if (error) {
          reject(`Invalid JWT: ${JSON.stringify(error)}`);
        } else {
          // Make sure decoded exists and is an object and id is defined and is a string
          if (
            typeof decoded === 'object' &&
            decoded !== null &&
            (decoded as {id: unknown}).id &&
            typeof (decoded as {id: unknown}).id === 'string'
          ) {
            resolve((decoded as {id: string}).id);
          } else {
            reject('Invalid JWT');
          }
        }
      },
    );
  });
}

async function isValidJwt(payload: string, pubkey: string): Promise<boolean> {
  return new Promise((resolve) => {
    verify(payload, pubkey, (error: VerifyErrors | undefined) => {
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

export async function generateJwt(account: string): Promise<string> {
  const jwtPrivateKey = await diskLogic.readJwtPrivateKeyFile();

  const jwtPubKey = await diskLogic.readJwtPublicKeyFile();

  const token = sign({id: account}, jwtPrivateKey, {
    expiresIn,
    algorithm: 'RS256',
  });

  if (!(await isValidJwt(token, jwtPubKey))) {
    throw new Error('Error generating JWT token.');
  }

  return token;
}
