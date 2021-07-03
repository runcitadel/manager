declare module 'lndconnect' {
    export type lnconnectUrlData = {
        host: string;
        cert: string;
        macaroon: string;

    }
    
    /**
     * Decode an lndconnect url.
     * @param  {String} lndconnect url to decode.
     * @return {lnconnectUrlData} Lnd connect data (object containing host, cert, and macaroon keys).
     */
    export function decode(string: string): lnconnectUrlData;
    /**
     * decode a tls certificate from a base64 encoded url string.
     * @param  {string} certString base64url encoded string to decode
     * @return {string} decoded certificate
     */
    export function decodeCert(certString: string): string;
    /**
     * decode a binary macaroon as a base64 decoded url string.
     * @param  {string} macaroonPath Path to macaroon file.
     * @return {string} decoded macaroon
     */
    export function decodeMacaroon(macaroonPath: string): string;
    
    /**
     * Encode a tls certificate as a base64 encoded url string.
     * @param  {string} certData Data of the certificate
     * @param  {BufferEncoding} format The format certData is stored in - defaults to 'utf-8'
     * @return {string} Encoded certificate
     */
    export function encodeCert(certData: string, format: BufferEncoding): string;

    /**
     * Encode a binary macaroon as a base64 encoded url string.
     * @param  {string} macaroonData Data of the macaroon
     * @param  {BufferEncoding} format The format macaroonData is stored in - defaults to 'hex'
     * @return {string} Encoded macaroon
     */
    export function encodeMacaroon(input: string, format: BufferEncoding): string;

    /**
     * Generate an lndconnect url.
     * @param  {lnconnectUrlData} data Data to encode (object containing host, cert, and macaroon keys).
     * @return {string} lndconnect url.
     */
    export function encode(data: lnconnectUrlData): string;

    /**
     * Parse an lndconnect url.
     * @param  {String} lndconnect url to parse.
     * @return {lnconnectUrlData} Lnd connect data (object containing host, cert, and macaroon keys).
     */
     export function parse(string: string): lnconnectUrlData;

    /**
     * Format an lndconnect url.
     * @param  {lnconnectUrlData} data Data to format (object containing host, cert, and macaroon keys).
     * @return {string} lndconnect URL
     */
    export function format(data: lnconnectUrlData): string;
}