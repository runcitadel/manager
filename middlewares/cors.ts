type StaticOrigin = boolean | string | RegExp | (boolean | string | RegExp)[];

export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, origin?: StaticOrigin) => void
  ): void => {
    const allowList = [
      "http://localhost:3000",
      "http://localhost:8080",
      "http://localhost",
      "http://citadel.local",
      ...(<string>process.env.DEVICE_HOSTS).split(","),
    ];

    if (!origin) return callback(new Error("Not allowed by CORS"));
    if (allowList.includes(origin) || !origin) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
};
