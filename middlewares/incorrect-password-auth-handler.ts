import {NodeError} from '@runcitadel/utils';
import {Request, Response, NextFunction, ErrorRequestHandler} from 'express';
import {STATUS_CODES} from '../utils/const.js';

const handleError = (
  error: Error,
  _request: Request,
  _response: Response,
  next: NextFunction,
) => {
  // If a incorrect password was given, respond with 403 instead of 401.
  // Reasoning: sending 401 on a request such as when the user tries to
  // change password with an incorrect password or enters an incorrect
  // password to view seed will log him out due to interceptor on front-end
  if (error.message && error.message === 'Incorrect password') {
    next(new NodeError('Incorrect password', STATUS_CODES.FORBIDDEN));
    return;
  }

  next();
};

export default handleError as ErrorRequestHandler;
