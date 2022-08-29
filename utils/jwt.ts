import jwt from "https://esm.sh/jsonwebtoken@8.5.1";
import { readJwtPublicKeyFile, readJwtPrivateKeyFile } from '../logic/disk.ts';

const {sign, verify} = jwt;

export async function getIdFromJwt(payload: string): Promise<string> {
  const pubkey = await readJwtPublicKeyFile();
  return new Promise((resolve, reject) => {
    verify(payload, pubkey, (error, decoded) => {
      if (error) {
        reject(new Error(`Invalid JWT: ${JSON.stringify(error)}`));
        // Make sure decoded exists and is an object and id is defined and is a string
      } else if (
        typeof decoded === 'object' &&
        typeof decoded.id === 'string'
      ) {
        resolve(decoded.id);
      } else {
        reject(new Error('Invalid JWT'));
      }
    });
  });
}

export function isValidJwt(payload: string, pubkey: string): Promise<boolean> {
  return new Promise((resolve) => {
    verify(payload, pubkey, (error) => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// Environmental variables are strings, the expiry will be interpreted as milliseconds if not converted to int.
const expiresIn = Deno.env.get("JWT_EXPIRATION")
  ? Number.parseInt(Deno.env.get("JWT_EXPIRATION") as string, 10)
  : 3600;

export async function generateJwt(account: string): Promise<string> {
  const jwtPrivateKey = await readJwtPrivateKeyFile();
  const jwtPubKey = await readJwtPublicKeyFile();

  const token = sign({id: account}, jwtPrivateKey, {
    expiresIn,
    algorithm: 'RS256',
  });

  if (!(await isValidJwt(token, jwtPubKey))) {
    throw new Error('Error generating JWT token.');
  }

  return token;
}
