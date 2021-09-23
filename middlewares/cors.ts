import * as process from 'node:process';
import {Context} from 'koa';

export const corsOptions = {
  origin: (ctx: Context): string => {
    const origin =
      ctx.headers.origin ?? ctx.request.headers.origin ?? ctx.origin;
    const allowList = [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost',
      'http://umbrel.local',
      ...process.env.DEVICE_HOSTS!.split(','),
    ];

    if (allowList.includes(origin) || !origin) {
      return '';
    }

    throw new Error('Not allowed by CORS');
  },
};
