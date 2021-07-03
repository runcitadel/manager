import { Router, Request, Response } from 'express';
import pjson from '../package.json';
const router = Router();

router.get('/', (request: Request, res: Response) => {
    res.json({version: 'umbrel-manager-' + pjson.version});
});

export default router;
