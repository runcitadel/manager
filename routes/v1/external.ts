import {Router} from 'express';
const router = Router();

import * as auth from '../../middlewares/auth.js';

import constants from '../../utils/const.js';
import {safeHandler} from '../../utils/safeHandler.js';

import { SocksProxyAgent } from 'socks-proxy-agent';

import fetch from 'node-fetch';

const agent = new SocksProxyAgent(`socks5h://${constants.TOR_PROXY_IP}:${constants.TOR_PROXY_PORT}`);

router.get('/price', auth.jwt, safeHandler(async (req, res) => {
    // Default to USD
    const currency = req.query.currency || 'USD';
    const response = await fetch(`https://min-api.cryptocompare.com/data/price?fsym=BTC&tsyms=${currency}`, {
        agent,
        method: 'GET'
    });

    try {
        return res.status(constants.STATUS_CODES.OK).json(response.json());
    } catch {
        return res.status(constants.STATUS_CODES.BAD_GATEWAY).json();
    }
}));

export default router;
