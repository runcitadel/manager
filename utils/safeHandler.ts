import { Request, Response, NextFunction } from 'express';

/* This safe handler is used to wrap our api methods
    so that we always fallback and return an exception if there is an error
    inside of an async function
    Mostly copied from vault/server/utils/safeHandler.js
    */
export function safeHandler(handler: (request: Request, res: Response, next: NextFunction) => unknown) {
    return async (request: Request, res: Response, next: NextFunction) => {
        try {
            return await handler(request, res, next);
        } catch (error) {
            return next(error);
        }
    };
}
