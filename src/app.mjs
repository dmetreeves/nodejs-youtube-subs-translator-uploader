import express from 'express';
//import favicon from 'serve-favicon';
import path from 'path';
import {fileURLToPath} from 'url';
import EnvVarsCjs  from './lib/EnvVars.js';
import basicAuth from 'express-basic-auth'
import { viewEngine } from './lib/express_helpers.mjs';
import { YandexTranslator3 } from "./lib/YandexTranslator3.mjs";
import { 
    youtubeOauthQuestionText, 
    googleUnauthedClients, 
    youtubeAuthedClientList,
    getIdFromYoutubeVideoUrl
} from './lib/google_functions.mjs';
import 'dotenv/config';
import formidable from 'formidable';
import AdmZip from 'adm-zip';

const { EnvVars } = EnvVarsCjs;
const env = new EnvVars(process.env);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const translator = new YandexTranslator3();
const googleOauthClientsCredsList = JSON.parse(
    env.oneByName('GOOGLE_OAUTH_CLIENTS_CREDS_LIST')
);

const app = express();

app.use(basicAuth({
    users: env.objByNameOrDefault("HTTP_BASIC_AUTH_CREDS", {trans:"late"}),
    challenge: true // <--- needed to actually show the login dialog!
}));

app.use(express.static(path.join(__dirname, '/public')));

//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.engine('html', viewEngine);
app.set('views', './views');
app.set('view engine', 'html');

app.get(['/','/translate'], (req, res) => {
    res.render('layout', { __dirname, title: 'Translate', body: 'translate', content: translator.yandexActiveLangNamesEn().join(', ') });
});
app.get('/langs', (req, res) => {
    const en = translator.yandexAllowedLangNamesEn();
    const ru = translator.yandexAllowedLangNamesRu();
    let rows = '';
    for(let code in en) {
        rows += `<tr><td>${ ru[code] }</td><td>${ en[code] }</td></tr>`;
    }
    res.render('layout', { __dirname, title: 'Languages', body: 'langs', content: rows });
});

app.get('/upload', async (req, res, next) => {
    const creds = googleOauthClientsCredsList;
    const uClients = await googleUnauthedClients( creds, req.query.code );
    req.unauthed_google_clients = uClients;
    if (uClients.length > 0) next('route'); // unauthed
    else next(); // authed
}, function (req, res, next) {
    //authed
    res.render('layout', { __dirname, title: 'Upload', body: 'upload', });
});
app.get('/upload', (req, res) => {
    // unauthed
    const text = youtubeOauthQuestionText(
        req.unauthed_google_clients.shift()
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(`<form action="/upload"><p>${ text }</p><input type="text" name="code"><button>submit</button></form>`)
});

app.post('/translate', function(req, res, next) {
    const form = formidable();
    form.parse(req, async function (err, fields) {
        try {
            const text = fields.text.replace(/\r\n/g, '\n');
            if(text == undefined || text.length == 0) {
                throw new Error("text field is missing!")
            }
            const langs = fields.languages;
            if(langs == undefined || langs.length == 0) {
                throw new Error("langs field is missing!")
            }
            let outputFileName = fields.filename;
            if(outputFileName === undefined)
                outputFileName = 'srt';
            else
                outputFileName = outputFileName.toString().trim();
            const result = await translator.translateAndGetZipBuffer( langs, text, outputFileName );
            if(result === undefined) {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.end('Текст субтитров не распознан или ошибка в коде не дает выполнить перевод :(');
            } else if(result === 'busy') {
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.end('Переводчик еще не завершил предыдущий запрос. Попробуйте позже.');
            } else {
                res.setHeader('Content-Type', 'application/zip');
                res.setHeader('Content-Disposition', `attachment; filename="${ outputFileName }.zip"`);
                res.end(result);
            }
        } catch(err) {
            next(err);
        }
    });
});

app.post('/upload', function(req, res, next) {
    const form = formidable();
    form.parse(req, async function (err, fields, files) {
        const zipPath = files.zip.path;
        try {
            const zip = new AdmZip(zipPath)    
            const zipEntries = await zip.getEntries(); // an array of ZipEntry records
            const clients = await youtubeAuthedClientList( 
                googleOauthClientsCredsList
            );
            if(clients.length == 0) {
                res.redirect('/upload');
            } else {
                let results = {};
                let outputs = {};
                const videoId = getIdFromYoutubeVideoUrl(fields.video);
                if(videoId == undefined) {
                    throw new Error("failed to recognize youtube video id");
                }
                //console.log('videoId',videoId);
                for(let client of clients) {
                    //let i = 0;
                    for(let entryIndex in zipEntries) {
                        const zipEntry = zipEntries[entryIndex];
                        if(zipEntry.isDirectory === true || zipEntry.entryName.indexOf('__MACOSX') > -1)
                            continue;
                            //i++;
                        const key = entryIndex;
                        if(results[key] === undefined || results[key] === false) {
                            const langName = zipEntry.name.split('.')[0];
                            const langCode = langName.split('_')[1];
                            if(langCode === undefined) {
                                continue;
                            }
                            //console.log('langName', langName);
                            //console.log('langCode', langCode);
                            //console.log('------');
                            try {
                                const res = await client.captions.insert({
                                    part: 'snippet',
                                    requestBody: {
                                        snippet: {
                                            videoId,
                                            language: langCode,
                                            name: '' // если не оставить пустым, то в ютубе будет выводиться двойное название "Английский - <name>"
                                        }
                                    },
                                    media: {
                                        body: zipEntry.getData().toString('utf8'),
                                    },
                                });
                                console.log('res.status', res.status);
                                if(res.status != 200 && res.code != 409) {
                                    results[key] = false;
                                    outputs[key] = { langName, langCode, result: res.errors };
                                } else {
                                    results[key] = true;
                                    outputs[key] = { langName, langCode, result: 'UPLOADED SUCCESSFULLY' };
                                }
                            } catch(e) {
                                if(e.code != 409) {
                                    results[key] = false;
                                    outputs[key] = { langName, langCode, result: e.message };
                                    console.error(e);
                                } else {
                                    //console.error('exists');
                                    results[key] = true;
                                    outputs[key] = { langName, langCode, result: 'ALREADY EXISTS IN THE VIDEO' };
                                }
                            }
                        }
                    }
                    //console.log('count=',i);
                }
                // console.log('videoid', getIdFromYoutubeVideoUrl(fields.video));
                // console.log('outputs', outputs);
                res.end(JSON.stringify(outputs));
            }
        } catch(e) {
            next(e);
        }
    });
});

app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send(err.message);
});

const port = env.oneByNameOrDefault("HTTP_PORT", 80);

app.listen(port, () => {
    console.log(`Subs app listening on port ${port}`);
});