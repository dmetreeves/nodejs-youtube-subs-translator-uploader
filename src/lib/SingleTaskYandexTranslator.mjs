import YandexTranslator from "./YandexTranslator.mjs";

export default class SingleTaskYandexTranslator {
    #subj;
    #isLocked = false;
    constructor(apiKey) {
        this.#subj = new YandexTranslator(
            apiKey
        );
    }
    yandexAllowedLangNamesEn() {
        return this.#subj.yandexAllowedLangNamesEn();
    }
    yandexAllowedLangNamesRu() {
        return this.#subj.yandexAllowedLangNamesRu();
    }
    yandexActiveLangNamesEn() {
        return this.#subj.yandexActiveLangNamesEn();
    }
    yandexActiveLangNamesRu() {
        return this.#subj.yandexActiveLangNamesRu();
    }
    yandexActiveLangCodes() {
        return this.#subj.yandexActiveLangCodes();
    }
    async translateAndGetZipBuffer(languagesStr, text, outputFilename) {
        if(this.#isLocked === true) {
            return 'busy';
        } else {
            this.#isLocked = true;
            const result = await this.#subj.translateAndGetZipBuffer(languagesStr, text, outputFilename);
            this.#isLocked = false;
            return result;

        }
    }
    langSelectOptionsHtml() {
        return this.#subj.langSelectOptionsHtml();
    }
    youtubeCodesPerLangsMapEn() {
        return this.#subj.youtubeCodesPerLangsMapEn();
    }
}