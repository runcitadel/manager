import {sign, verify, VerifyErrors} from 'jsonwebtoken';
import * as diskLogic from '../logic/disk.js';

// Environmental variables are Strings, the expiry will be interpreted as milliseconds if not converted to int.
// eslint-disable-next-line no-magic-numbers
const expiresIn = process.env.JWT_EXPIRATION ? Number.parseInt(process.env.JWT_EXPIRATION) : 3600;

export async function generateJWT(account: string) {
    const jwtPrivateKey = await diskLogic.readJWTPrivateKeyFile();

    const jwtPubKey = await diskLogic.readJWTPublicKeyFile();

    // eslint-disable-next-line object-shorthand
    const token = await sign({id: account}, <any>jwtPrivateKey, {expiresIn: expiresIn, algorithm: 'RS256'});

    await verify(token, <any>jwtPubKey, (error: VerifyErrors | null) => {
        if (error) {
            return Promise.reject(new Error('Error generating JWT token.'));
        }
    });

    return token;
}
