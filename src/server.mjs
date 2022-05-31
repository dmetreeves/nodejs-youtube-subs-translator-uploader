import fs from 'fs';
import { URL } from 'url';
import http from 'http';
import AdmZip from 'adm-zip';
import formidable from 'formidable';
import EnvVarsCjs  from './lib/EnvVars.js';
import { DiskFile } from './lib/DiskFile.mjs';
import { YandexTranslator3 } from "./YandexTranslator3.mjs";
import { youtubeAuthedClientsList } from './google_functions.mjs';
import { HttpGetParamInterface } from './HttpGetParamInterface.mjs';

import 'dotenv/config';

const { EnvVars } = EnvVarsCjs;
const env = new EnvVars(process.env);

const translator = new YandexTranslator3()

const googleOauthClientsCredsList = JSON.parse(
    env.oneByName('GOOGLE_OAUTH_CLIENTS_CREDS_LIST')
)

function getIdFromYoutubeVideoUrl(url) {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length == 11) {
        return match[2];
    } else {
        return undefined;
    }
}

async function respond (req, res) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    const url = new URL(req.url, `http://${ req.headers.host }`);
    const params = url.searchParams;
    const googleOauthCodeRequester = new HttpGetParamInterface(params, res, '/upload', 'code');
    if (req.method === "GET") {
        if(req.url === '/favicon.ico') {
            res.setHeader('Content-Type', 'image/x-icon');
            fs.createReadStream('./public/favicon.ico').pipe(res);
        } else if(req.url === '/styles.css') {
            res.setHeader('Content-Type', 'text/css');
            fs.createReadStream('./public/styles.css').pipe(res);
        } else if(req.url.substr(0,7) === '/upload') {
            const clients = await youtubeAuthedClientsList( 
                googleOauthClientsCredsList,
                googleOauthCodeRequester
            );
            if(clients.length == googleOauthClientsCredsList.length) {
                let html = (new DiskFile('./upload.html')).readSync();
                res.end( html );
            } else {
                res.end( 'Повторите попытку' );
            }
        } else if(req.url.substr(0,7) === '/langs') {
            let html = (new DiskFile('./langs.html')).readSync();
            const en = translator.yandexAllowedLangNamesEn();
            const ru = translator.yandexAllowedLangNamesRu();
            let rows = '';
            for(let code in en) {
                rows += `<tr><td>${ ru[code] }</td><td>${ en[code] }</td></tr>`;
            }
            let table =`<table border="1" cellpadding="10"><tr><th>Название</th><th>Обозначение</th></tr>${ rows }</table>`;
            html = html.replace('{{table}}', table);
            res.end( html );
        } else {
            let html = (new DiskFile('./translate.html')).readSync();
            html = html.replace('{{langNames}}', translator.yandexActiveLangNamesEn().join(', '));
            res.end( html );
        }
    } else if (req.method === "POST") {
        const form = formidable();
        form.parse(req, async function (err, fields, files) {

            if(req.url === '/upload') {
                console.log(fields, files);
                const zip = new AdmZip(files.zip.path);
                const zipEntries = zip.getEntries(); // an array of ZipEntry records

                const clients = await youtubeAuthedClientsList( 
                    googleOauthClientsCredsList,
                    googleOauthCodeRequester
                );
                if(clients.length > 0) {
                    let results = {};
                    let outputs = {};
                    const videoId = getIdFromYoutubeVideoUrl(fields.video);
                    for(let client of clients) {
                        let i = 0;
                        for(let entryIndex in zipEntries) {
                            const zipEntry = zipEntries[entryIndex];
                            if(zipEntry.isDirectory === true || zipEntry.entryName.indexOf('__MACOSX') > -1)
                                continue;
                                i++;
                            const key = entryIndex;
                            if(results[key] === undefined || results[key] === false) {
                                const langName = zipEntry.name.split('.')[0];
                                console.log('langName', langName);
                                const langCode = langName.split('_')[1];
                                console.log('langCode', langCode);
                                console.log('------');
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
                                        console.error('exists');
                                        results[key] = true;
                                        outputs[key] = { langName, langCode, result: 'UPLOADED SUCCESSFULLY' };
                                    }
                                }
                            }
                        }
                        console.log('count=',i);
                    }
                    console.log('videoid', getIdFromYoutubeVideoUrl(fields.video));
                    console.log('outputs', outputs);
                    res.end(JSON.stringify(outputs));
                }
            } else if (req.url === '/translate') {
                const text = fields.text.replace(/\r\n/g, '\n');

                let outputFileName = fields.filename;
                if(outputFileName === undefined)
                    outputFileName = 'srt';
                else
                    outputFileName = outputFileName.toString();
                const result = await translator.translateAndGetZipBuffer( fields.languages, text, outputFileName );

                if(result === undefined) {
                    res.end('Текст субтитров не распознан или ошибка в коде не дает выполнить перевод :(');
                } else if(result === 'busy') {
                    res.end('Переводчик еще не завершил предыдущий запрос. Попробуйте позже.');
                } else {
                    //res.writeHead(200, { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="${ outputFileName }.zip"` });
                    res.setHeader('Content-Type', 'application/zip');
                    res.setHeader('Content-Disposition', `attachment; filename="${ outputFileName }.zip"`);
                    res.end(result);
                }
            }
        });
    }
}

function httpRes401(res) {
    // Sending a 401 will require authentication, we need to send the 'WWW-Authenticate' to tell them the sort of authentication to use
    // Basic auth is quite literally the easiest and least secure, it simply gives back  base64( username + ":" + password ) from the browser
    res.statusCode = 401;
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');

    res.end('<html><body>Need some creds son</body></html>');
}

function doBasicAuth(req, res, successCallback) {

    const auth = req.headers['authorization'];  // auth is in base64(username:password)  so we need to decode the base64

    if(!auth) {     // No Authorization header was passed in so it's the first time the browser hit us
        httpRes401(res);
    } else if(auth) {    // The Authorization was passed in so now we validate it
        const splitted_auth = auth.split(' ');   // Split on a space, the original auth looks like  "Basic Y2hhcmxlczoxMjM0NQ==" and we need the 2nd part
        if( splitted_auth === undefined || splitted_auth[1] === undefined ) {
            httpRes401(res);
        } else {
            const buf = new Buffer.from(splitted_auth[1], 'base64'); // create a buffer and tell it the data coming in is base64
            const plain_auth = buf.toString();        // read it back out as a string


            // At this point plain_auth = "username:password"

            const creds = plain_auth.split(':');      // split on a ':'
            const username = creds[0];
            const password = creds[1];

            if((['hdajshuwhdn', 'trans'].includes(username)) && (['qweuiouifljfshdfgkhsd', 'late'].includes(password))) {   // Is the username/password correct?
                successCallback();
            }
            else {
                res.statusCode = 401; // Force them to retry authentication
                res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');

                // res.statusCode = 403;   // or alternatively just reject them altogether with a 403 Forbidden

                res.end('<html><body>You shall not pass!!!</body></html>');
            }
        }
    }
}

const server = http.createServer(function(req, res) {
    doBasicAuth(req, res, function() {
        respond(req, res);
    });
});

const port = 80;

server.listen(port, () => {
    console.log(`Server is running on ${ port }`);
});