import { config } from 'dotenv';
config();
import * as path from 'path';
import express from 'express';
import { Request, Response } from 'express';
import morgan from 'morgan';
import passport from 'passport';
import cors from 'cors';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));


// Keep requestCorrelationId middleware as the first middleware. Otherwise we risk losing logs.
import requestCorrelationMiddleware from './middlewares/requestCorrelationId.js'; // eslint-disable-line id-length
import {camelCaseMiddleware, errorHandlerMiddleware} from '@runcitadel/utils';
import {corsOptions} from './middlewares/cors.js';

import * as logger from './utils/logger.js';

import ping from './routes/ping.js';
import account from './routes/v1/account.js';
import system from './routes/v1/system.js';
import external from './routes/v1/external.js';
import apps from './routes/v1/apps.js';

const app = express();

// Handles CORS
app.use(cors(<any>corsOptions));

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

app.use(requestCorrelationMiddleware);
app.use(camelCaseMiddleware);
app.use(morgan(<any>logger.morganConfiguration));

app.use('/ping', ping);
app.use('/v1/account', account);
app.use('/v1/system', system);
app.use('/v1/external', external);
app.use('/v1/apps', apps);

app.use(errorHandlerMiddleware);
app.use((req: Request, res: Response) => {
    res.status(404).json(); // eslint-disable-line no-magic-numbers
});

export default app;
