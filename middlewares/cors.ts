import * as process from 'node:process';

type StaticOrigin =
  | boolean
  | string
  | RegExp
  | Array<boolean | string | RegExp>;

export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (error: Error | null, origin?: StaticOrigin) => void,
  ): void => {
    const allowList = [
      'http://localhost:3000',
      'http://localhost:8080',
      'http://localhost',
      'http://umbrel.local',
      ...process.env.DEVICE_HOSTS!.split(','),
    ];

    if (allowList.includes(origin || 'THISISNOTINTHEALLOWLIST') || !origin) {
      callback(null, true);
      return;
    }

    callback(new Error('Not allowed by CORS'));
  },
};
