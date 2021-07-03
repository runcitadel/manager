import camelize from 'camelize-ts';
export function camelCaseRequest(request, res, next) {
    if (request && request.body) {
        request.body = camelize(request.body);
    }
    next();
}
