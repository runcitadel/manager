import {Router} from 'express';
const router = Router();

import * as appsLogic from '../../logic/apps';

import * as auth from '../../middlewares/auth';

import constants from '../../utils/const';
import safeHandler from '../../utils/safeHandler';

router.get('/', auth.jwt, safeHandler(async (req, res) => {
    const query = {
        installed: req.query.installed === '1',
    };
    const apps = await appsLogic.get(query);

    return res.status(constants.STATUS_CODES.OK).json(apps);
}));

router.post('/:id/install', auth.jwt, safeHandler(async (req, res) => {
    const {id} = req.params;
    const result = await appsLogic.install(id);

    return res.status(constants.STATUS_CODES.OK).json(result);
}));

router.post('/:id/uninstall', auth.jwt, safeHandler(async (req, res) => {
    const {id} = req.params;
    const result = await appsLogic.uninstall(id);

    return res.status(constants.STATUS_CODES.OK).json(result);
}));

module.exports = router;
