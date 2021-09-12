/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {Router as expressRouter, Request, Response} from 'express';

import {NodeError, safeHandler, validator} from '@runcitadel/utils';
import type {user as userFile} from '@runcitadel/utils';
import * as authLogic from '../../logic/auth.js';

import * as auth from '../../middlewares/auth.js';
import incorrectPasswordAuthHandler from '../../middlewares/incorrect-password-auth-handler.js';

import {STATUS_CODES} from '../../utils/const.js';

const router = expressRouter();

const COMPLETE = 100;

// Endpoint to change your password.
router.post(
  '/change-password',
  auth.convertRequestBodyToBasicAuth,
  auth.basic,
  incorrectPasswordAuthHandler,
  safeHandler(async (request: Request, response: Response, next) => {
    if (
      typeof request.body.password !== 'string' ||
      typeof request.body.newPassword !== 'string'
    )
      throw new NodeError('Received invalid data.');
    // Use password from the body by default. Basic auth has issues handling special characters.
    const currentPassword: string = request.body.password as string;
    const newPassword: string = request.body.newPassword as string;

    try {
      validator.isString(currentPassword);
      validator.isMinPasswordLength(currentPassword);
      validator.isString(newPassword);
      validator.isMinPasswordLength(newPassword);
      if (newPassword === currentPassword) {
        throw new Error(
          'The new password must not be the same as existing password',
        );
      }
    } catch (error: unknown) {
      next(error);
      return;
    }

    const status = authLogic.getChangePasswordStatus();

    // Return a conflict if a change password process is already running
    if (status.percent > 0 && status.percent !== COMPLETE) {
      return response.status(STATUS_CODES.CONFLICT).json();
    }

    try {
      // Start change password process in the background and immediately return
      await authLogic.changePassword(currentPassword, newPassword);
      return response.status(STATUS_CODES.OK).json();
    } catch (error: unknown) {
      next(error);
    }
  }),
);

// Returns the current status of the change password process.
router.get(
  '/change-password/status',
  auth.jwt,
  safeHandler(async (request, response) => {
    const status = authLogic.getChangePasswordStatus();

    return response.status(STATUS_CODES.OK).json(status);
  }),
);

// Registered does not need auth. This is because the user may not be registered at the time and thus won't always have
// an auth token.
router.get(
  '/registered',
  safeHandler(async (request, response) =>
    authLogic.isRegistered().then((registered) => response.json({registered})),
  ),
);

// Endpoint to register a password with the device. Wallet must not exist. This endpoint is authorized with basic auth
// or the property password from the body.
router.post(
  '/register',
  auth.convertRequestBodyToBasicAuth,
  auth.register,
  safeHandler(async (request, response, next) => {
    const seed: string[] = request.body.seed as string[];
    const user: userFile = request.user as userFile;

    if (seed.length !== 24) {
      throw new Error('Invalid seed length');
    }

    try {
      validator.isString(request.body.name);
      validator.isString(user.plainTextPassword);
      validator.isMinPasswordLength(user.plainTextPassword!);
    } catch (error: unknown) {
      next(error);
      return;
    }

    // Add name to user obj
    user.name = request.body.name; // eslint-disable-line @typescript-eslint/no-unsafe-assignment

    const jwt = await authLogic.register(user, seed);

    return response.json(jwt);
  }),
);

router.post(
  '/login',
  auth.convertRequestBodyToBasicAuth,
  auth.basic,
  safeHandler(async (request, response) => {
    const jwt = await authLogic.login(request.user as userFile);

    return response.json({jwt});
  }),
);

router.get(
  '/info',
  auth.jwt,
  safeHandler(async (request, response) => {
    const info = await authLogic.getInfo();

    return response.status(STATUS_CODES.OK).json(info);
  }),
);

router.post(
  '/seed',
  auth.convertRequestBodyToBasicAuth,
  auth.basic,
  incorrectPasswordAuthHandler,
  safeHandler(async (request, response) => {
    const seed = await authLogic.seed(request.user as userFile);

    return response.json({seed});
  }),
);

router.post(
  '/refresh',
  auth.jwt,
  safeHandler(async (request, response) =>
    authLogic
      .refresh(request.user as userFile)
      .then((jwt) => response.json(jwt)),
  ),
);

export default router;
