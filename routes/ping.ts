import { Router, Request, Response } from 'express';
// @ts-ignore
import * as pjson from '../package.json';
const router = Router();

router.get('/', (request, res) => {
    res.json({version: 'umbrel-manager-' + pjson.version});
});

module.exports = router;
