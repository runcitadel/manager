import {Router} from 'express';
const router = Router();

import * as auth from '../../middlewares/auth';

import constants from '../../utils/const';
import safeHandler from '../../utils/safeHandler';

import {SocksProxyAgent} from 'socks-proxy-agent';
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

module.exports = router;
