import axios from 'axios';

export class YandexTranslateApiV1o5 {
    #urlPattern = `https://translate.yandex.net/api/v1.5/tr.json/translate?key={apiKey}&text={text}&lang=en-{lang}&format=plain&options=1`;
    #apiKey;
    constructor(apiKey) {
        this.#apiKey = apiKey;
    }
    translateChunksIntoLang(chunks, langCode) {
        return new Promise(async (resolve, reject) => {
            let outputText = '';
            for(let chunk of chunks) {
                const result = await this.#apiRequest(chunk, langCode);
                if(result.data.code === 200) {
                    outputText += result.data.text[0] + '\n';
                } else {
                    reject('request error code: ' + result.data.code)
                }
            }
            resolve(outputText);
        });
    }
    #apiRequest(text, langCode) {
        const url = this.#urlPattern.replace('{apiKey}', this.#apiKey).replace('{text}', encodeURIComponent(text)).replace('{lang}', langCode);
        return axios.get(url);
    }
}