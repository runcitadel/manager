import { config } from 'dotenv';
config();
import * as path from 'path';
import * as express from 'express';
import * as morgan from 'morgan';
import * as passport from 'passport';
import * as cors from 'cors';

// Keep requestCorrelationId middleware as the first middleware. Otherwise we risk losing logs.
const requestCorrelationMiddleware = require('./middlewares/requestCorrelationId'); // eslint-disable-line id-length
const camelCaseRequestMiddleware = require('./middlewares/camelCaseRequest').camelCaseRequest;
const corsOptions = require('./middlewares/cors').corsOptions;
const errorHandleMiddleware = require('middlewares/errorHandling');
require('./middlewares/auth');

const logger = require('./utils/logger');

const ping = require('./routes/ping');
const account = require('./routes/v1/account');
const system = require('./routes/v1/system');
const external = require('./routes/v1/external');
const apps = require('./routes/v1/apps');

const app = express();

// Handles CORS
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());

app.use(requestCorrelationMiddleware);
app.use(camelCaseRequestMiddleware);
app.use(morgan(logger.morganConfiguration));

app.use('/ping', ping);
app.use('/v1/account', account);
app.use('/v1/system', system);
app.use('/v1/external', external);
app.use('/v1/apps', apps);

app.use(errorHandleMiddleware);
app.use((request, res) => {
    res.status(404).json(); // eslint-disable-line no-magic-numbers
});

module.exports = app;
