import type Router from '@koa/router';
import type {
  DefaultContext,
  DefaultState,
  Next,
  ParameterizedContext,
  Context,
} from 'koa';

export default async function errorHandlerMiddleware(
  ctx:
    | ParameterizedContext<
        DefaultState,
        DefaultContext &
          Router.RouterParamContext<DefaultState, DefaultContext>,
        any
      >
    | Context,
  next: Next,
): Promise<void> {
  try {
    await next();
  } catch (error: unknown | Error) {
    ctx.status = (error as {status: number}).status || 500;
    ctx.body = JSON.stringify(
      (error as {message: string}).message || 'An error occurred',
    );
    ctx.app.emit('error', error, ctx);
  }
}
