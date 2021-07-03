import { v4 as createUUID } from 'uuid';
import constants from '../utils/const';
import {createNamespace} from 'continuation-local-storage';
const apiRequest = createNamespace(constants.REQUEST_CORRELATION_NAMESPACE_KEY);
import { Request, NextFunction, Response } from 'express';

function addCorrelationId(request: Request, res: Response, next: NextFunction) {
    apiRequest.bindEmitter(request);
    apiRequest.bindEmitter(res);
    apiRequest.run(() => {
        apiRequest.set(constants.REQUEST_CORRELATION_ID_KEY, createUUID());
        next();
    });
}

module.exports = addCorrelationId;
