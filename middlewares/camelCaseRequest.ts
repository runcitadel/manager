import camelize from 'camelize-ts';
import { Request, Response, NextFunction } from 'express';

export function camelCaseRequest(request: Request, res: Response, next: NextFunction) {
    if (request && request.body) {
        request.body = camelize(request.body);
    }

    next();
}
