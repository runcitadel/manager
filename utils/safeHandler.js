/* This safe handler is used to wrap our api methods
    so that we always fallback and return an exception if there is an error
    inside of an async function
    Mostly copied from vault/server/utils/safeHandler.js
    */
function safeHandler(handler) {
    return async (request, res, next) => {
        try {
            return await handler(request, res, next);
        } catch (error) {
            return next(error);
        }
    };
}

module.exports = safeHandler;
