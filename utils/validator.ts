import validator from 'validator';

import {ValidationError} from '../models/errors.js';

// Max length is listed here,
// https://github.com/lightningnetwork/lnd/blob/fd1f6a7bc46b1e50ff3879b8bd3876d347dbb73d/channeldb/invoices.go#L84
const MAX_MEMO_LENGTH = 1024;
const MIN_PASSWORD_LENGTH = 12;

export function isAlphanumeric(string: string) {
    isDefined(string);

    if (!validator.isAlphanumeric(string)) {
        throw new ValidationError('Must include only alpha numeric characters.');
    }
}

export function isAlphanumericAndSpaces(string: string) {
    isDefined(string);

    if (!validator.matches(string, '^[a-zA-Z0-9\\s]*$')) {
        throw new ValidationError('Must include only alpha numeric characters and spaces.');
    }
}

export function isBoolean(value: unknown) {
    if (value !== true && value !== false) {
        throw new ValidationError('Must be true or false.');
    }
}

export function isDecimal(amount: unknown) {
    if (!validator.isDecimal(<string>amount)) {
        throw new ValidationError('Must be decimal.');
    }
}

export function isDefined(object: unknown) {
    if (object === undefined) {
        throw new ValidationError('Must define variable.');
    }
}

export function isMinPasswordLength(password: unknown) {
    if ((<any>password).length < MIN_PASSWORD_LENGTH) {
        throw new ValidationError('Must be ' + MIN_PASSWORD_LENGTH + ' or more characters.');
    }
}

export function isPositiveInteger(amount: unknown) {
    if (!validator.isInt(String(amount), {gt: 0})) {
        throw new ValidationError('Must be positive integer.');
    }
}

export function isPositiveIntegerOrZero(amount: unknown) {
    if (!validator.isInt(String(amount), {gt: -1})) {
        throw new ValidationError('Must be positive integer.');
    }
}

export function isString(object: unknown) {
    if (typeof object !== 'string') {
        throw new ValidationError('Object must be of type string.');
    }
}

export function isValidMemoLength(string: unknown) {
    if (Buffer.byteLength(<any>string, 'utf8') > MAX_MEMO_LENGTH) {
        throw new ValidationError('Must be less than ' + MAX_MEMO_LENGTH + ' bytes.');
    }
}
