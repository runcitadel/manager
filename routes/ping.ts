import { Router, Request, Response } from 'express';
// @ts-ignore
import pjson from '../package.json';
const router = Router();

router.get('/', (request: Request, res: Response) => {
    res.json({version: 'umbrel-manager-' + pjson.version});
});

export default router;
