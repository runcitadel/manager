/* eslint-disable no-unused-vars, no-magic-numbers */
import * as logger from '../utils/logger.js';
import { Request, NextFunction, Response, ErrorRequestHandler } from 'express';

const handleError = (err: Error, request: Request, res: Response, next: NextFunction) => {
    const statusCode = (<any>err).statusCode || 500;
    const route = request.url || '';
    const message = err.message || '';

    logger.error(message, route, err.stack);

    res.status(statusCode).json(message);

    return next();
}

export default <ErrorRequestHandler>handleError;