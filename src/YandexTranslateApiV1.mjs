// import http from 'http';
// import https from 'https';
import axios from 'axios';
import querystring  from 'querystring';
import { DiskFile } from "./lib/DiskFile.mjs";

const sessIdFile = new DiskFile('./yandex_api_sess_id.txt');

export class YandexTranslateApiV1 {
    #url = `https://translate.yandex.net/api/v1/tr.json/translate?srv=tr-text&reason=paste&format=text`;
    constructor() {
        
    }
    translateChunksIntoLang(chunks, langCode) {
        return new Promise(async (resolve, reject) => {
            let outputText = '';
            let sessId;
            try {
                // test if session is valid
                sessId = sessIdFile.contentSync();
                await this.#apiRequest('Hello', 'ru', sessId);
            } catch(e) {
                console.log('session id is invalid');
                console.error(e);
                sessId = await this.#sessionId();
                await sessIdFile.write(sessId);
            }
            for(let chunk of chunks) {
                const result = await this.#apiRequest(chunk, langCode, sessId);
                if(result.data.code === 200) {
                    outputText += result.data.text[0] + '\n';
                } else {
                    reject('request error code: ' + result.data.code)
                }
            }
            resolve(outputText);
        });
    }
    #apiRequest(text, langCode, sessionId) {
        const url = this.#url + `&id=${ sessionId }&lang=en-${ langCode }`;

        return axios.post(
            url, 
            querystring.stringify({
                text: text, 
                options: 4
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
                    'origin': 'https://translate.yandex.com',
                    'referer': 'https://translate.yandex.com/?lang=en-ru',
                }
            }
        );
    }
    async #sessionId() {
        // const options = { localAddress: '51.178.184.68' };
        // const httpAgent = new http.Agent(options);
        // const httpsAgent = new https.Agent(options);

        return new Promise(async (resolve, reject) => {
            const res = await axios.get('https://translate.yandex.com', {
            //     httpAgent, 
            //     httpsAgent,
                headers: {
                    'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
                }
            });
            const matches = res.data.match(/Ya\.reqid = '(.+)';/);
            if(matches !== null) {
                const reqId = matches[1] + '-0-0';
                console.log('reqId', reqId);
                resolve(reqId);
            } else {
                console.log('need to handle captcha');
                reject();
            }
        });
    }
}