import { Request, Response, NextFunction } from 'express';

const toCamel = (s: string) => {
    return s.replace(/([-_][a-z])/ig, ($1) => {
      return $1.toUpperCase()
        .replace('-', '')
        .replace('_', '');
    });
  };

 function camelize (object: Object) {
    if (typeof object === 'string') return toCamel(object);
    if(typeof object !== "object") return object;
    return Object
      .entries(object)
      .reduce((carry, [key, value]) => {
        // @ts-expect-error
        carry[toCamel(key)] = value
        return carry
      }, {})
  }

export function camelCaseRequest(request: Request, res: Response, next: NextFunction) {
    if (request && request.body) {
        request.body = camelize(request.body);
    }

    next();
}
