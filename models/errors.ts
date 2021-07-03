/* eslint-disable no-magic-numbers */
export class NodeError extends Error {
    statusCode?: number;
    constructor (message: string, statusCode?: number) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.message = message;
        this.statusCode = statusCode;
    }
}

export class ValidationError extends Error {
    statusCode?: number;
    constructor (message: string, statusCode: number) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.name = this.constructor.name;
        this.message = message;
        this.statusCode = statusCode || 400;
    }
}

