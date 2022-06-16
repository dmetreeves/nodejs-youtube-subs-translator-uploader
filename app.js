import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import EnvVars  from './lib/EnvVars.js';
import basicAuth from 'express-basic-auth'
import { 
    viewEngine, 
    getLangsEndpoint,
    getTranslateEndpoint,
    getUploadEndpoint,
    postTranslateEndpoint,
    postUploadEndpoint
} from './lib/express_helpers.mjs';
import SingleTaskYandexTranslator from './lib/SingleTaskYandexTranslator.mjs'
import 'dotenv/config';

const env = new EnvVars(process.env);

const translator = new SingleTaskYandexTranslator(
    env.oneByName('YANDEX_API_KEY')
);
const googleOauthClientsCredsList = JSON.parse(
    env.oneByName('GOOGLE_OAUTH_CLIENTS_CREDS_LIST')
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(basicAuth({
    users: env.objByNameOrDefault("HTTP_SERVER_BASIC_AUTH_CREDS", {trans:"late"}),
    challenge: true // <--- needed to actually show the login dialog!
}));

app.use(express.static(path.join(__dirname, '/public')));

app.engine('html', viewEngine);
app.set('views', './views');
app.set('view engine', 'html');

app.get(['/','/translate'], getTranslateEndpoint(translator));
app.get('/langs', getLangsEndpoint(translator));
app.get('/upload', getUploadEndpoint(googleOauthClientsCredsList));
app.post('/translate', postTranslateEndpoint(translator));
app.post('/upload', postUploadEndpoint(googleOauthClientsCredsList));

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send(err.message);
});

const port = env.oneByNameOrDefault("HTTP_SERVER_PORT", 80);

app.listen(port, () => {
    console.log(`Subs app listening on port ${ port }`);
});