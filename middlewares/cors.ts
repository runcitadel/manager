export const corsOptions = {
    origin: (origin: string, callback: (...args: unknown[]) => unknown) :unknown => {
        const allowList = [
            'http://localhost:3000',
            'http://localhost:8080',
            'http://localhost',
            'http://umbrel.local',
            ...(<string>process.env.DEVICE_HOSTS).split(',')
        ];

        if (allowList.includes(origin) || !origin) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    }
};
