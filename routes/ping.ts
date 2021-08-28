import {Router, Request, Response} from 'express';
import pjson from '../package.json';

// eslint-disable-next-line new-cap
const router = Router();

router.get('/', (request: Request, response: Response) => {
  response.json({version: 'manager-' + pjson.version});
});

export default router;
