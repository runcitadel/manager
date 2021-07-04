import fetch from 'node-fetch';

const lnapiUrl = process.env.MIDDLEWARE_API_URL || 'http://localhost';
const lnapiPort = process.env.MIDDLEWARE_API_PORT || 3005;

export async function changePassword(currentPassword: string, newPassword: string, jwt: string): Promise<unknown> {
    const headers = {
        Authorization: 'JWT ' + jwt,
        'Content-Type': 'text/json'
    };

    const body = {
        currentPassword,
        newPassword
    };

    return fetch(lnapiUrl + ':' + lnapiPort + '/v1/lnd/wallet/changePassword', {
        body: JSON.stringify(body),
        headers,
        method: 'POST'
    });
}

export async function initializeWallet(password: string, seed: string[], jwt: string): Promise<unknown> {
    const headers = {
        Authorization: 'JWT ' + jwt,
        'Content-Type': 'text/json'
    };

    const body = {
        password,
        seed
    };

    return await fetch(lnapiUrl + ':' + lnapiPort + '/v1/lnd/wallet/init', {
        body: JSON.stringify(body),
        headers,
        method: 'POST'
    });
}

export async function getStatus(): Promise<unknown> {
    return await (await fetch(lnapiUrl + ':' + lnapiPort + '/v1/lnd/info/status')).json();
}
