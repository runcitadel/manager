import { readJwtPrivateKeyFile } from "../logic/disk.ts";
import { RSA } from "https://deno.land/x/god_crypto@v1.4.10/rsa.ts";
import { encode } from "https://deno.land/x/god_crypto@v1.4.10/encode.ts";
import { encode as encodeBase64, decode } from "https://deno.land/std@0.153.0/encoding/base64url.ts";
import { getNumericDate } from "https://deno.land/x/djwt@v2.7/mod.ts";

export async function isValidJwt(
  jwt: string,
  pubkey: string,
): Promise<boolean> {
  try {
    const [header, payload, signature] = jwt.split(".");

    const key = RSA.parseKey(pubkey);
    const rsa = new RSA(key);

    const isValid = await rsa.verify(
      encode.base64url(signature),
      header + "." + payload,
      { algorithm: "rsassa-pkcs1-v1_5", hash: "sha256" },
    );
    const decodedPayload = JSON.parse(
      new TextDecoder().decode(decode(payload)),
    );
    return isValid && (decodedPayload.exp >= Date.now() / 1000);
  } catch (err) {
    console.error(err);
    return false;
  }
}

// Environmental variables are strings, the expiry will be interpreted as milliseconds if not converted to int.
const expiresIn = Deno.env.get("JWT_EXPIRATION")
  ? Number.parseInt(Deno.env.get("JWT_EXPIRATION") as string, 10)
  : 3600;

export async function generateJwt(account: string): Promise<string> {
  const expiration = getNumericDate(expiresIn);
  // {"alg":"RS256","typ":"JWT"} as base64url
  const header = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9";
  const payload = encodeBase64(
    JSON.stringify({ account, exp: expiration }),
  );
  const unsigned = `${header}.${payload}`;

  const key = RSA.parseKey(await readJwtPrivateKeyFile());
  const rsa = new RSA(key);

  const signature = await rsa.sign(
    unsigned,
    { algorithm: "rsassa-pkcs1-v1_5", hash: "sha256" },
  );

  return `${unsigned}.${signature.base64url()}`;
}
