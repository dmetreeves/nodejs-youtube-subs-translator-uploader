import { DiskFile } from './DiskFile.mjs';
import { 
    googleUnauthedClients,
    youtubeOauthQuestionText,
    youtubeAuthedClientList,
    getIdFromYoutubeVideoUrl
} from './google_functions.mjs';
import formidable from 'formidable';
import AdmZip from 'adm-zip';
import path from 'path';

function viewEngine(filePath, options, callback) {
    const viewsDirName = path.dirname(filePath);
    try {
        const layout = (new DiskFile(filePath)).readSync();
        const body = (new DiskFile(path.join(viewsDirName, `/${options.body}_body.html`))).readSync();
        const rendered = layout.toString()
            .replace('#title#', options.title)
            .replace('#body#', 
                ('' + body + '')
                .replace('#content#', '' + options.content + '')
            );
        return callback(null, rendered);
    } catch (e) {
        return callback(e);
    }
}

function getLangsEndpoint(translator) {
    return (req, res) => {
        const en = translator.yandexAllowedLangNamesEn();
        const ru = translator.yandexAllowedLangNamesRu();
        let rows = '';
        for(let code in en) {
            rows += `<tr><td>${ ru[code] }</td><td>${ en[code] }</td></tr>`;
        }
        res.render('layout', { title: 'Languages', body: 'langs', content: rows });
    }
}

function getTranslateEndpoint(translator) {
    return (req, res) => {
        res.render('layout', { title: 'Translate', body: 'translate', content: translator.yandexActiveLangNamesEn().join(', ') });
    }
}

function getUploadEndpoint(googleCreds) {
    return async (req, res, next) => {
        const unauthedClients = await googleUnauthedClients( googleCreds, req.query.code );
        if (unauthedClients.length > 0) {
            const text = youtubeOauthQuestionText( unauthedClients.shift() );
            res.render('layout', { title: 'Upload', body: 'upload_auth', content: text });
        }
        else {
            res.render('layout', { title: 'Upload', body: 'upload', });
        }
    }
}

function postTranslateEndpoint(translator) {
    return function(req, res, next) {
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
                if(outputFileName === undefined || outputFileName.length == 0)
                    outputFileName = 'srt';
                else
                    outputFileName = outputFileName.toString().trim();
                const result = await translator.translateAndGetZipBuffer( langs, text, outputFileName );
                if(result === undefined) {
                    throw new Error('Текст субтитров не распознан или ошибка в коде не дает выполнить перевод :(');
                } else if(result === 'busy') {
                    throw new Error('Переводчик еще не завершил предыдущий запрос. Попробуйте позже.');
                } else {
                    res.setHeader('Content-Type', 'application/zip');
                    res.setHeader('Content-Disposition', `attachment; filename="${ outputFileName }.zip"`);
                    res.end(result);
                }
            } catch(err) {
                next(err);
            }
        });
    }
}

function postUploadEndpoint(googleCreds) {
    return function(req, res, next) {
        const form = formidable();
        form.parse(req, async function (err, fields, files) {
            const zipPath = files.zip.path;
            try {
                const zip = new AdmZip(zipPath)    
                const zipEntries = await zip.getEntries(); // an array of ZipEntry records
                const clients = await youtubeAuthedClientList( 
                    googleCreds
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
    }
}

export {
    viewEngine,
    getLangsEndpoint,
    getTranslateEndpoint,
    getUploadEndpoint,
    postTranslateEndpoint,
    postUploadEndpoint
}