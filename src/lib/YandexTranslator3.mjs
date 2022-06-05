import AdmZip from 'adm-zip';
import { DiskFile } from "./DiskFile.mjs";
import { SrtStream } from "./SrtStream.mjs";
import { TranslatedStrings } from "./TranslatedStrings.mjs";
import { YandexTranslateApiV1o5 } from "./YandexTranslateApiV1o5.mjs";

import EnvVarsCjs  from './EnvVars.js';

import 'dotenv/config';

const { EnvVars } = EnvVarsCjs;
const env = new EnvVars(process.env);

const api = new YandexTranslateApiV1o5( env.oneByName('YANDEX_API_KEY') );

function splitInEqualChunksByNewLineRecursivelyIfLongerThan(target, max_length, chunks = []) {
    if(max_length < 1) return [str];
    const substrs = splitInHalfByNewLineIfLongerThan(target, max_length);
    for(let substr of substrs) {
        if(substr.length > max_length) {
            splitInEqualChunksByNewLineRecursivelyIfLongerThan(substr, max_length, chunks)
        } else {
            chunks.push(substr);
        }
    }
    return chunks;
}

function splitInHalfByNewLineIfLongerThan(target, max_length) {
    if(target.length > max_length) {
        const chunks = target.split('\n');
        if(chunks.length > 1) {
            const half = Math.ceil(chunks.length / 2);    
            const firstHalf = chunks.slice(0, half);
            const lastHalf = chunks.slice(half, target.length);
            return [firstHalf.join('\n'), lastHalf.join('\n')];
        } else {
            return [target];
        }
    } else {
        return [target];
    }
}

export class YandexTranslator3 {
    #activeLanguagesPerCodesMapRu = {};
    #allowedYandexLanguagesPerCodesMapRu = {"az":"Азербайджанский","sq":"Албанский","am":"Амхарский","en":"Английский","ar":"Арабский","hy":"Армянский","af":"Африкаанс","eu":"Баскский","ba":"Башкирский","be":"Белорусский","bn":"Бенгальский","my":"Бирманский","bg":"Болгарский","bs":"Боснийский","cy":"Валлийский","hu":"Венгерский","vi":"Вьетнамский","ht":"Гаитянский","gl":"Галисийский","mrj":"Горномарийский","el":"Греческий","ka":"Грузинский","gu":"Гуджарати","da":"Датский","zu":"Зулу","he":"Иврит","yi":"Идиш","id":"Индонезийский","ga":"Ирландский","is":"Исландский","es":"Испанский","it":"Итальянский","kk":"Казахский","kazlat":"Казахский (латиница)","kn":"Каннада","ca":"Каталанский","ky":"Киргизский","zh":"Китайский","ko":"Корейский","xh":"Коса","km":"Кхмерский","lo":"Лаосский","la":"Латынь","lv":"Латышский","lt":"Литовский","lb":"Люксембургский","mk":"Македонский","mg":"Малагасийский","ms":"Малайский","ml":"Малаялам","mt":"Мальтийский","mi":"Маори","mr":"Маратхи","mhr":"Марийский","mn":"Монгольский","de":"Немецкий","ne":"Непальский","nl":"Нидерландский","no":"Норвежский","pa":"Панджаби","pap":"Папьяменто","fa":"Персидский","pl":"Польский","pt":"Португальский","ro":"Румынский","ru":"Русский","ceb":"Себуанский","sr":"Сербский","si":"Сингальский","sk":"Словацкий","sl":"Словенский","sw":"Суахили","su":"Сунданский","tl":"Тагальский","tg":"Таджикский","th":"Тайский","ta":"Тамильский","tt":"Татарский","te":"Телугу","tr":"Турецкий","udm":"Удмуртский","uz":"Узбекский","uzbcyr":"Узбекский (кириллица)","uk":"Украинский","ur":"Урду","fi":"Финский","fr":"Французский","hi":"Хинди","hr":"Хорватский","cs":"Чешский","cv":"Чувашский","sv":"Шведский","gd":"Шотландский (гэльский)","sjn":"Эльфийский (синдарин)","emj":"Эмодзи","eo":"Эсперанто","et":"Эстонский","jv":"Яванский","sah":"Якутский","ja":"Японский"};

    #activeLanguagesPerCodesMapEn = {"ar":"Arabic","az":"Azerbaijani","bg":"Bulgarian","da":"Danish","nl":"Dutch","en":"English","fi":"Finnish","fr":"French","de":"German","el":"Greek","hi":"Hindi","hu":"Hungarian","id":"Indonesian","it":"Italian","ja":"Japanese","kk":"Kazakh","km":"Khmer","ko":"Korean","lo":"Lao","la":"Latin","ms":"Malay","mn":"Mongolian","ne":"Nepali","no":"Norwegian","fa":"Persian","pl":"Polish","pt":"Portuguese","ru":"Russian","sr":"Serbian","es":"Spanish","sv":"Swedish","ta":"Tamil","th":"Thai","tr":"Turkish","vi":"Vietnamese"};
    #allowedYandexLanguagesPerCodesMapEn = {"af":"Afrikaans","sq":"Albanian","am":"Amharic","ar":"Arabic","hy":"Armenian","az":"Azerbaijani","ba":"Bashkir","eu":"Basque","be":"Belarusian","bn":"Bengali","bs":"Bosnian","bg":"Bulgarian","my":"Burmese","ca":"Catalan","ceb":"Cebuano","zh":"Chinese","cv":"Chuvash","hr":"Croatian","cs":"Czech","da":"Danish","nl":"Dutch","sjn":"Elvish (Sindarin)","emj":"Emoji","en":"English","eo":"Esperanto","et":"Estonian","fi":"Finnish","fr":"French","gl":"Galician","ka":"Georgian","de":"German","el":"Greek","gu":"Gujarati","ht":"Haitian","he":"Hebrew","mrj":"Hill Mari","hi":"Hindi","hu":"Hungarian","is":"Icelandic","id":"Indonesian","ga":"Irish","it":"Italian","ja":"Japanese","jv":"Javanese","kn":"Kannada","kk":"Kazakh","kazlat":"Kazakh (Latin)","km":"Khmer","ko":"Korean","ky":"Kyrgyz","lo":"Lao","la":"Latin","lv":"Latvian","lt":"Lithuanian","lb":"Luxembourgish","mk":"Macedonian","mg":"Malagasy","ms":"Malay","ml":"Malayalam","mt":"Maltese","mi":"Maori","mr":"Marathi","mhr":"Mari","mn":"Mongolian","ne":"Nepali","no":"Norwegian","pap":"Papiamento","fa":"Persian","pl":"Polish","pt":"Portuguese","pa":"Punjabi","ro":"Romanian","ru":"Russian","gd":"Scottish Gaelic","sr":"Serbian","si":"Sinhalese","sk":"Slovak","sl":"Slovenian","es":"Spanish","su":"Sundanese","sw":"Swahili","sv":"Swedish","tl":"Tagalog","tg":"Tajik","ta":"Tamil","tt":"Tatar","te":"Telugu","th":"Thai","tr":"Turkish","udm":"Udmurt","uk":"Ukrainian","ur":"Urdu","uz":"Uzbek","uzbcyr":"Uzbek (Cyrillic)","vi":"Vietnamese","cy":"Welsh","xh":"Xhosa","sah":"Yakut","yi":"Yiddish","zu":"Zulu"};
    
    #youtubeLanguagesPerCodesMapEn = {"ab":"Abkhazian","aa":"Afar","af":"Afrikaans","sq":"Albanian","ase":"American Sign Language","am":"Amharic","ar":"Arabic","arc":"Aramaic","hy":"Armenian","as":"Assamese","ay":"Aymara","az":"Azerbaijani","bn":"Bangla","ba":"Bashkir","eu":"Basque","be":"Belarusian","bh":"Bhojpuri","bi":"Bislama","bs":"Bosnian","br":"Breton","bg":"Bulgarian","my":"Burmese","yue":"Cantonese","yue-HK":"Cantonese (Hong Kong)","ca":"Catalan","chr":"Cherokee","zh":"Chinese","zh-CN":"Chinese (China)","zh-HK":"Chinese (Hong Kong)","zh-Hans":"Chinese (Simplified)","zh-SG":"Chinese (Singapore)","zh-TW":"Chinese (Taiwan)","zh-Hant":"Chinese (Traditional)","cho":"Choctaw","co":"Corsican","hr":"Croatian","cs":"Czech","da":"Danish","nl":"Dutch","nl-BE":"Dutch (Belgium)","nl-NL":"Dutch (Netherlands)","dz":"Dzongkha","en":"English","en-CA":"English (Canada)","en-IN":"English (India)","en-IE":"English (Ireland)","en-GB":"English (United Kingdom)","en-US":"English (United States)","eo":"Esperanto","et":"Estonian","fo":"Faroese","fj":"Fijian","fil":"Filipino","fi":"Finnish","fr":"French","fr-BE":"French (Belgium)","fr-CA":"French (Canada)","fr-FR":"French (France)","fr-CH":"French (Switzerland)","ff":"Fulah","gl":"Galician","ka":"Georgian","de":"German","de-AT":"German (Austria)","de-DE":"German (Germany)","de-CH":"German (Switzerland)","el":"Greek","gn":"Guarani","gu":"Gujarati","ht":"Haitian Creole","hak":"Hakka Chinese","hak-TW":"Hakka Chinese (Taiwan)","ha":"Hausa","iw":"Hebrew","hi":"Hindi","hi-Latn":"Hindi (Latin)","ho":"Hiri Motu","hu":"Hungarian","is":"Icelandic","ig":"Igbo","id":"Indonesian","ia":"Interlingua","ie":"Interlingue","iu":"Inuktitut","ik":"Inupiaq","ga":"Irish","it":"Italian","ja":"Japanese","jv":"Javanese","kl":"Kalaallisut","kn":"Kannada","ks":"Kashmiri","kk":"Kazakh","km":"Khmer","rw":"Kinyarwanda","tlh":"Klingon","ko":"Korean","ku":"Kurdish","ky":"Kyrgyz","lo":"Lao","la":"Latin","lv":"Latvian","ln":"Lingala","lt":"Lithuanian","lb":"Luxembourgish","mk":"Macedonian","mg":"Malagasy","ms":"Malay","ml":"Malayalam","mt":"Maltese","mni":"Manipuri","mi":"Maori","mr":"Marathi","mas":"Masai","nan":"Min Nan Chinese","nan-TW":"Min Nan Chinese (Taiwan)","lus":"Mizo","mn":"Mongolian","na":"Nauru","nv":"Navajo","ne":"Nepali","no":"Norwegian","oc":"Occitan","or":"Odia","om":"Oromo","ps":"Pashto","fa":"Persian","fa-AF":"Persian (Afghanistan)","fa-IR":"Persian (Iran)","pl":"Polish","pt":"Portuguese","pt-BR":"Portuguese (Brazil)","pt-PT":"Portuguese (Portugal)","pa":"Punjabi","qu":"Quechua","ro":"Romanian","mo":"Romanian (Moldova)","rm":"Romansh","rn":"Rundi","ru":"Russian","ru-Latn":"Russian (Latin)","sm":"Samoan","sg":"Sango","sa":"Sanskrit","sc":"Sardinian","gd":"Scottish Gaelic","sr":"Serbian","sr-Cyrl":"Serbian (Cyrillic)","sr-Latn":"Serbian (Latin)","sh":"Serbo-Croatian","sdp":"Sherdukpen","sn":"Shona","scn":"Sicilian","sd":"Sindhi","si":"Sinhala","sk":"Slovak","sl":"Slovenian","so":"Somali","st":"Southern Sotho","es":"Spanish","es-419":"Spanish (Latin America)","es-MX":"Spanish (Mexico)","es-ES":"Spanish (Spain)","es-US":"Spanish (United States)","su":"Sundanese","sw":"Swahili","ss":"Swati","sv":"Swedish","tl":"Tagalog","tg":"Tajik","ta":"Tamil","tt":"Tatar","te":"Telugu","th":"Thai","bo":"Tibetan","ti":"Tigrinya","tpi":"Tok Pisin","to":"Tongan","ts":"Tsonga","tn":"Tswana","tr":"Turkish","tk":"Turkmen","tw":"Twi","uk":"Ukrainian","ur":"Urdu","uz":"Uzbek","vi":"Vietnamese","vo":"Volapük","vro":"Võro","cy":"Welsh","fy":"Western Frisian","wo":"Wolof","xh":"Xhosa","yi":"Yiddish","yo":"Yoruba","zu":"Zulu"};
    
    constructor() {
        //this.#activeLanguagesPerCodesMapEn = Object.assign({}, this.#allowedYandexLanguagesPerCodesMapEn);
        //this.#activeLanguagesPerCodesMapRu = Object.assign({}, this.#allowedYandexLanguagesPerCodesMapRu);
    }
    yandexAllowedLangNamesEn() {
        return this.#allowedYandexLanguagesPerCodesMapEn;
    }
    yandexAllowedLangNamesRu() {
        return this.#allowedYandexLanguagesPerCodesMapRu;
    }
    yandexActiveLangNamesEn() {
        return Object.values(this.#activeLanguagesPerCodesMapEn);
    }
    yandexActiveLangNamesRu() {
        return Object.values(this.#activeLanguagesPerCodesMapRu);
    }
    yandexActiveLangCodes() {
        return Object.keys(this.#activeLanguagesPerCodesMapEn);
    }
    youtubeCodesPerLangsMapEn() {
        function objectFlip(obj) {
            const ret = {};
            Object.keys(obj).forEach(key => {
                ret[obj[key]] = key;
            });
            return ret;
        }
        return objectFlip(this.#youtubeLanguagesPerCodesMapEn);
    }
    langSelectOptionsHtml() {
        let result = '';
        for(let code in this.#allowedYandexLanguagesPerCodesMapEn)
            result += `<option value="${ code }">${ this.#allowedYandexLanguagesPerCodesMapEn[code] }</option>`;
        return result;
    }
    async translateAndGetZipBuffer(languagesStr, text, outputFilename) {
        await (new DiskFile(`./srt`)).remove({ recursive: true, force: true });

        const srt = new SrtStream(text);
        const shortSrcText = srt.asTextWithoutMetadata(); // нужно убирать метаданные из строк сабов, чтобы переведчик не перевел арабские числительные на словесные языковые цифры
        if(shortSrcText.length === 0) {
            return;
        }

        const chunks = splitInEqualChunksByNewLineRecursivelyIfLongerThan(shortSrcText, 500);

        let langCodes = [];
        this.#activeLanguagesPerCodesMapEn = {};
        const reqLangNames = languagesStr.split(', ');
        const allowedLangNames = Object.values(this.#allowedYandexLanguagesPerCodesMapEn);
        for(let name of reqLangNames) {
            if(allowedLangNames.includes(name)) {
                const code = getObjKeyByValue(this.#allowedYandexLanguagesPerCodesMapEn, name);
                langCodes.push(code);
                this.#activeLanguagesPerCodesMapEn[code] = name;
            }
        }

        let result;

        for(let langCode of langCodes) {
            let outputText = '';
            if(langCode === 'en') {
                outputText = shortSrcText;
            } else {
                outputText = await api.translateChunksIntoLang(chunks, langCode);
            }
            //console.log('outputText', outputText);
            const translatedStr = new TranslatedStrings(shortSrcText, outputText);
            const translatedStrAsJsObj = translatedStr.asJsObj();
            const outputTextWithMetadata = srt.asTranslatedText( translatedStrAsJsObj );

            await (new DiskFile(`./srt/${ this.#activeLanguagesPerCodesMapEn[langCode] }_${ langCode }.srt`)).write( outputTextWithMetadata );

            console.log(langCode + ' - ok');
        }
        const zip = new AdmZip();
        zip.addLocalFolder("./srt");
        zip.writeZip(`./result/${ outputFilename }.zip`);
        console.log('zipped');
        result = zip.toBuffer();
        
        return result;
    }
}

function getObjKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}
