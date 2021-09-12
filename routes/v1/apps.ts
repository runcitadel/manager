import {Router} from 'express';

import {safeHandler} from '@runcitadel/utils';
import * as appsLogic from '../../logic/apps.js';

import * as auth from '../../middlewares/auth.js';

import {STATUS_CODES} from '../../utils/const.js';

// eslint-disable-next-line new-cap
const router = Router();

router.get(
  '/',
  auth.jwt,
  safeHandler(async (request, response) => {
    const query = {
      installed: request.query.installed === '1',
    };
    const apps = await appsLogic.get(query);

    response.status(STATUS_CODES.OK).json(apps);
  }),
);

router.post(
  '/:id/install',
  auth.jwt,
  safeHandler(async (request, response) => {
    const {id} = request.params;
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    const result = await appsLogic.install(id);

    response.status(STATUS_CODES.OK).json(result);
  }),
);

router.post(
  '/:id/uninstall',
  auth.jwt,
  safeHandler(async (request, response) => {
    const {id} = request.params;
    // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    const result = await appsLogic.uninstall(id);

    response.status(STATUS_CODES.OK).json(result);
  }),
);

export default router;
