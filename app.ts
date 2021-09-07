import * as path from 'node:path';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {config} from 'dotenv';
import express, {Request, Response} from 'express';
import morgan from 'morgan';
import passport from 'passport';
import cors from 'cors';

import {camelCaseMiddleware, errorHandlerMiddleware} from '@runcitadel/utils';
import {corsOptions} from './middlewares/cors.js';

import ping from './routes/ping.js';
import account from './routes/v1/account.js';
import system from './routes/v1/system.js';
import external from './routes/v1/external.js';
import apps from './routes/v1/apps.js';

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

// Handles CORS
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

app.use(camelCaseMiddleware);
app.use(morgan('combined'));

app.use('/ping', ping);
app.use('/v1/account', account);
app.use('/v1/system', system);
app.use('/v1/external', external);
app.use('/v1/apps', apps);

app.use(errorHandlerMiddleware);
app.use((request: Request, response: Response) => {
  response.status(404).json();
});

export default app;
