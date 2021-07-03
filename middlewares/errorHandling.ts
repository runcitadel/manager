/* eslint-disable no-unused-vars, no-magic-numbers */
import * as logger from '../utils/logger';
import {NodeError, ValidationError } from '../models/errors';
import { Request, NextFunction, Response } from 'express';

function handleError(error: NodeError | ValidationError, request: Request, res: Response, next: NextFunction) {
    const statusCode = error.statusCode || 500;
    const route = request.url || '';
    const message = error.message || '';

    logger.error(message, route, error.stack);

    res.status(statusCode).json(message);
}

module.exports = handleError;
