import fetch from 'node-fetch';

const lnapiUrl = process.env.MIDDLEWARE_API_URL || 'http://localhost';
const lnapiPort = process.env.MIDDLEWARE_API_PORT || 3005;

export async function changePassword(currentPassword: string, newPassword: string, jwt: string): Promise<unknown> {
    const headers = {
        Authorization: 'JWT ' + jwt,
        'Content-Type': 'application/json'
    };

    const body = JSON.stringify({
        currentPassword,
        newPassword
    });

    const data = await fetch(lnapiUrl + ':' + lnapiPort + '/v1/lnd/wallet/changePassword', {
        body,
        headers,
        method: 'POST'
    });

    return data;
}

export async function initializeWallet(password: string, seed: string[], jwt: string): Promise<unknown> {
    const headers = {
        Authorization: 'JWT ' + jwt,
        'Content-Type': 'application/json'
    };

    const body = JSON.stringify({
        password,
        seed
    });

    const data = await fetch(lnapiUrl + ':' + lnapiPort + '/v1/lnd/wallet/init', {
        body,
        headers,
        method: 'POST'
    });

    return data;
}

export async function getStatus(): Promise<unknown> {
    return await (await fetch(lnapiUrl + ':' + lnapiPort + '/v1/lnd/info/status')).json();
}
