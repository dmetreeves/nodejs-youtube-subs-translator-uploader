import AdmZip from 'adm-zip';
import { DiskFile } from "./lib/DiskFile.mjs";
import { SrtStream } from "./SrtStream.mjs";
import { TranslatedStrings } from "./TranslatedStrings.mjs";
import { puppeteerNewTempPage } from './puppeteer_functions.mjs';

export class YandexTranslator {
    #activeLanguagesPerCodesMapRu = {};
    #allowedYandexLanguagesPerCodesMapRu = {"az":"Азербайджанский","sq":"Албанский","am":"Амхарский","en":"Английский","ar":"Арабский","hy":"Армянский","af":"Африкаанс","eu":"Баскский","ba":"Башкирский","be":"Белорусский","bn":"Бенгальский","my":"Бирманский","bg":"Болгарский","bs":"Боснийский","cy":"Валлийский","hu":"Венгерский","vi":"Вьетнамский","ht":"Гаитянский","gl":"Галисийский","mrj":"Горномарийский","el":"Греческий","ka":"Грузинский","gu":"Гуджарати","da":"Датский","zu":"Зулу","he":"Иврит","yi":"Идиш","id":"Индонезийский","ga":"Ирландский","is":"Исландский","es":"Испанский","it":"Итальянский","kk":"Казахский","kazlat":"Казахский (латиница)","kn":"Каннада","ca":"Каталанский","ky":"Киргизский","zh":"Китайский","ko":"Корейский","xh":"Коса","km":"Кхмерский","lo":"Лаосский","la":"Латынь","lv":"Латышский","lt":"Литовский","lb":"Люксембургский","mk":"Македонский","mg":"Малагасийский","ms":"Малайский","ml":"Малаялам","mt":"Мальтийский","mi":"Маори","mr":"Маратхи","mhr":"Марийский","mn":"Монгольский","de":"Немецкий","ne":"Непальский","nl":"Нидерландский","no":"Норвежский","pa":"Панджаби","pap":"Папьяменто","fa":"Персидский","pl":"Польский","pt":"Португальский","ro":"Румынский","ru":"Русский","ceb":"Себуанский","sr":"Сербский","si":"Сингальский","sk":"Словацкий","sl":"Словенский","sw":"Суахили","su":"Сунданский","tl":"Тагальский","tg":"Таджикский","th":"Тайский","ta":"Тамильский","tt":"Татарский","te":"Телугу","tr":"Турецкий","udm":"Удмуртский","uz":"Узбекский","uzbcyr":"Узбекский (кириллица)","uk":"Украинский","ur":"Урду","fi":"Финский","fr":"Французский","hi":"Хинди","hr":"Хорватский","cs":"Чешский","cv":"Чувашский","sv":"Шведский","gd":"Шотландский (гэльский)","sjn":"Эльфийский (синдарин)","emj":"Эмодзи","eo":"Эсперанто","et":"Эстонский","jv":"Яванский","sah":"Якутский","ja":"Японский"};

    #activeLanguagesPerCodesMapEn = {};
    #allowedYandexLanguagesPerCodesMapEn = {"af":"Afrikaans","sq":"Albanian","am":"Amharic","ar":"Arabic","hy":"Armenian","az":"Azerbaijani","ba":"Bashkir","eu":"Basque","be":"Belarusian","bn":"Bengali","bs":"Bosnian","bg":"Bulgarian","my":"Burmese","ca":"Catalan","ceb":"Cebuano","zh":"Chinese","cv":"Chuvash","hr":"Croatian","cs":"Czech","da":"Danish","nl":"Dutch","sjn":"Elvish (Sindarin)","emj":"Emoji","en":"English","eo":"Esperanto","et":"Estonian","fi":"Finnish","fr":"French","gl":"Galician","ka":"Georgian","de":"German","el":"Greek","gu":"Gujarati","ht":"Haitian","he":"Hebrew","mrj":"Hill Mari","hi":"Hindi","hu":"Hungarian","is":"Icelandic","id":"Indonesian","ga":"Irish","it":"Italian","ja":"Japanese","jv":"Javanese","kn":"Kannada","kk":"Kazakh","kazlat":"Kazakh (Latin)","km":"Khmer","ko":"Korean","ky":"Kyrgyz","lo":"Lao","la":"Latin","lv":"Latvian","lt":"Lithuanian","lb":"Luxembourgish","mk":"Macedonian","mg":"Malagasy","ms":"Malay","ml":"Malayalam","mt":"Maltese","mi":"Maori","mr":"Marathi","mhr":"Mari","mn":"Mongolian","ne":"Nepali","no":"Norwegian","pap":"Papiamento","fa":"Persian","pl":"Polish","pt":"Portuguese","pa":"Punjabi","ro":"Romanian","ru":"Russian","gd":"Scottish Gaelic","sr":"Serbian","si":"Sinhalese","sk":"Slovak","sl":"Slovenian","es":"Spanish","su":"Sundanese","sw":"Swahili","sv":"Swedish","tl":"Tagalog","tg":"Tajik","ta":"Tamil","tt":"Tatar","te":"Telugu","th":"Thai","tr":"Turkish","udm":"Udmurt","uk":"Ukrainian","ur":"Urdu","uz":"Uzbek","uzbcyr":"Uzbek (Cyrillic)","vi":"Vietnamese","cy":"Welsh","xh":"Xhosa","sah":"Yakut","yi":"Yiddish","zu":"Zulu"};

    #youtubeLanguagesPerCodesMapRu = {"ab":"Абхазский","az":"Азербайджанский","ay":"Аймара","sq":"Албанский","am":"Амхарский","en":"Английский","en-GB":"Английский (Великобритания)","en-IN":"Английский (Индия)","en-IE":"Английский (Ирландия)","en-CA":"Английский (Канада)","en-US":"Английский (Соединенные Штаты)","ar":"Арабский","arc":"Арамейский","hy":"Армянский","as":"Ассамский","aa":"Афарский","af":"Африкаанс","eu":"Баскский","ba":"Башкирский","be":"Белорусский","bn":"Бенгальский","my":"Бирманский","bi":"Бислама","bg":"Болгарский","bs":"Боснийский","br":"Бретонский","bh":"Бходжпури","cy":"Валлийский","hu":"Венгерский","vo":"Волапюк","wo":"Волоф","vi":"Вьетнамский","ht":"Гаитянский","gl":"Галисийский","kl":"Гренландский","el":"Греческий","ka":"Грузинский","gn":"Гуарани","gu":"Гуджарати","gd":"Гэльский","da":"Датский","dz":"Дзонг-кэ","fy":"Западнофризский","zu":"Зулу","iw":"Иврит","ig":"Игбо","yi":"Идиш","id":"Индонезийский","ia":"Интерлингва","ie":"Интерлингве","iu":"Инуктитут","ik":"Инупиак","ga":"Ирландский","is":"Исландский","es":"Испанский","es-ES":"Испанский (Испания)","es-419":"Испанский (Латинская Америка)","es-MX":"Испанский (Мексика)","es-US":"Испанский (Соединенные Штаты)","it":"Итальянский","yo":"Йоруба","kk":"Казахский","kn":"Каннада","yue":"Кантонский","yue-HK":"Кантонский (Гонконг)","ca":"Каталанский","ks":"Кашмири","qu":"Кечуа","rw":"Киньяруанда","ky":"Киргизский","zh":"Китайский","zh-HK":"Китайский (Гонконг)","zh-CN":"Китайский (Китай)","zh-SG":"Китайский (Сингапур)","zh-TW":"Китайский (Тайвань)","zh-Hant":"Китайский (традиционная китайская)","zh-Hans":"Китайский (упрощенная китайская)","tlh":"Клингонский","ko":"Корейский","co":"Корсиканский","xh":"Коса","ku":"Курдский","km":"Кхмерский","lo":"Лаосский","la":"Латинский","lv":"Латышский","ln":"Лингала","lt":"Литовский","lb":"Люксембургский","mk":"Македонский","mg":"Малагасийский","ms":"Малайский","ml":"Малаялам","mt":"Мальтийский","mni":"Манипурский","mi":"Маори","mr":"Маратхи","mas":"Масаи","lus":"Мизо","nan":"Миньнань","nan-TW":"Миньнань (Тайвань)","mn":"Монгольский","nv":"Навахо","na":"Науру","de":"Немецкий","de-AT":"Немецкий (Австрия)","de-DE":"Немецкий (Германия)","de-CH":"Немецкий (Швейцария)","ne":"Непальский","nl":"Нидерландский","nl-BE":"Нидерландский (Бельгия)","nl-NL":"Нидерландский (Нидерланды)","no":"Норвежский","oc":"Окситанский","or":"Ория","om":"Оромо","pa":"Панджаби","fa":"Персидский","fa-AF":"Персидский (Афганистан)","fa-IR":"Персидский (Иран)","pl":"Польский","pt":"Португальский","pt-BR":"Португальский (Бразилия)","pt-PT":"Португальский (Португалия)","ps":"Пушту","rm":"Романшский","ro":"Румынский","mo":"Румынский (Молдова)","rn":"Рунди","ru":"Русский","ru-Latn":"Русский (латиница)","sm":"Самоанский","sg":"Санго","sa":"Санскрит","sc":"Сардинский","ss":"Свази","sr":"Сербский","sr-Cyrl":"Сербский (кириллица)","sr-Latn":"Сербский (латиница)","sh":"Сербскохорватский","si":"Сингальский","sd":"Синдхи","scn":"Сицилийский","sk":"Словацкий","sl":"Словенский","so":"Сомали","sw":"Суахили","su":"Сунданский","tl":"Тагалог","tg":"Таджикский","th":"Тайский","ta":"Тамильский","tt":"Татарский","tw":"Тви","te":"Телугу","bo":"Тибетский","ti":"Тигринья","tpi":"Ток-писин","to":"Тонганский","tn":"Тсвана","ts":"Тсонга","tr":"Турецкий","tk":"Туркменский","uz":"Узбекский","uk":"Украинский","ur":"Урду","fo":"Фарерский","fj":"Фиджи","fil":"Филиппинский","fi":"Финский","fr":"Французский","fr-BE":"Французский (Бельгия)","fr-CA":"Французский (Канада)","fr-FR":"Французский (Франция)","fr-CH":"Французский (Швейцария)","ff":"Фулах","hak":"Хакка","hak-TW":"Хакка (Тайвань)","ha":"Хауса","hi":"Хинди","hi-Latn":"Хинди (латиница)","ho":"Хиримоту","hr":"Хорватский","chr":"Чероки","cs":"Чешский","cho":"Чоктавский","sv":"Шведский","sn":"Шона","eo":"Эсперанто","et":"Эстонский","st":"Южный сото","jv":"Яванский","ja":"Японский","ase":"Ase","sdp":"Sdp","vro":"Vro"};
    #youtubeLanguagesPerCodesMapEn = {"ab":"Abkhazian","aa":"Afar","af":"Afrikaans","sq":"Albanian","ase":"American Sign Language","am":"Amharic","ar":"Arabic","arc":"Aramaic","hy":"Armenian","as":"Assamese","ay":"Aymara","az":"Azerbaijani","bn":"Bangla","ba":"Bashkir","eu":"Basque","be":"Belarusian","bh":"Bhojpuri","bi":"Bislama","bs":"Bosnian","br":"Breton","bg":"Bulgarian","my":"Burmese","yue":"Cantonese","yue-HK":"Cantonese (Hong Kong)","ca":"Catalan","chr":"Cherokee","zh":"Chinese","zh-CN":"Chinese (China)","zh-HK":"Chinese (Hong Kong)","zh-Hans":"Chinese (Simplified)","zh-SG":"Chinese (Singapore)","zh-TW":"Chinese (Taiwan)","zh-Hant":"Chinese (Traditional)","cho":"Choctaw","co":"Corsican","hr":"Croatian","cs":"Czech","da":"Danish","nl":"Dutch","nl-BE":"Dutch (Belgium)","nl-NL":"Dutch (Netherlands)","dz":"Dzongkha","en":"English","en-CA":"English (Canada)","en-IN":"English (India)","en-IE":"English (Ireland)","en-GB":"English (United Kingdom)","en-US":"English (United States)","eo":"Esperanto","et":"Estonian","fo":"Faroese","fj":"Fijian","fil":"Filipino","fi":"Finnish","fr":"French","fr-BE":"French (Belgium)","fr-CA":"French (Canada)","fr-FR":"French (France)","fr-CH":"French (Switzerland)","ff":"Fulah","gl":"Galician","ka":"Georgian","de":"German","de-AT":"German (Austria)","de-DE":"German (Germany)","de-CH":"German (Switzerland)","el":"Greek","gn":"Guarani","gu":"Gujarati","ht":"Haitian Creole","hak":"Hakka Chinese","hak-TW":"Hakka Chinese (Taiwan)","ha":"Hausa","iw":"Hebrew","hi":"Hindi","hi-Latn":"Hindi (Latin)","ho":"Hiri Motu","hu":"Hungarian","is":"Icelandic","ig":"Igbo","id":"Indonesian","ia":"Interlingua","ie":"Interlingue","iu":"Inuktitut","ik":"Inupiaq","ga":"Irish","it":"Italian","ja":"Japanese","jv":"Javanese","kl":"Kalaallisut","kn":"Kannada","ks":"Kashmiri","kk":"Kazakh","km":"Khmer","rw":"Kinyarwanda","tlh":"Klingon","ko":"Korean","ku":"Kurdish","ky":"Kyrgyz","lo":"Lao","la":"Latin","lv":"Latvian","ln":"Lingala","lt":"Lithuanian","lb":"Luxembourgish","mk":"Macedonian","mg":"Malagasy","ms":"Malay","ml":"Malayalam","mt":"Maltese","mni":"Manipuri","mi":"Maori","mr":"Marathi","mas":"Masai","nan":"Min Nan Chinese","nan-TW":"Min Nan Chinese (Taiwan)","lus":"Mizo","mn":"Mongolian","na":"Nauru","nv":"Navajo","ne":"Nepali","no":"Norwegian","oc":"Occitan","or":"Odia","om":"Oromo","ps":"Pashto","fa":"Persian","fa-AF":"Persian (Afghanistan)","fa-IR":"Persian (Iran)","pl":"Polish","pt":"Portuguese","pt-BR":"Portuguese (Brazil)","pt-PT":"Portuguese (Portugal)","pa":"Punjabi","qu":"Quechua","ro":"Romanian","mo":"Romanian (Moldova)","rm":"Romansh","rn":"Rundi","ru":"Russian","ru-Latn":"Russian (Latin)","sm":"Samoan","sg":"Sango","sa":"Sanskrit","sc":"Sardinian","gd":"Scottish Gaelic","sr":"Serbian","sr-Cyrl":"Serbian (Cyrillic)","sr-Latn":"Serbian (Latin)","sh":"Serbo-Croatian","sdp":"Sherdukpen","sn":"Shona","scn":"Sicilian","sd":"Sindhi","si":"Sinhala","sk":"Slovak","sl":"Slovenian","so":"Somali","st":"Southern Sotho","es":"Spanish","es-419":"Spanish (Latin America)","es-MX":"Spanish (Mexico)","es-ES":"Spanish (Spain)","es-US":"Spanish (United States)","su":"Sundanese","sw":"Swahili","ss":"Swati","sv":"Swedish","tl":"Tagalog","tg":"Tajik","ta":"Tamil","tt":"Tatar","te":"Telugu","th":"Thai","bo":"Tibetan","ti":"Tigrinya","tpi":"Tok Pisin","to":"Tongan","ts":"Tsonga","tn":"Tswana","tr":"Turkish","tk":"Turkmen","tw":"Twi","uk":"Ukrainian","ur":"Urdu","uz":"Uzbek","vi":"Vietnamese","vo":"Volapük","vro":"Võro","cy":"Welsh","fy":"Western Frisian","wo":"Wolof","xh":"Xhosa","yi":"Yiddish","yo":"Yoruba","zu":"Zulu"};
    constructor() {
        this.#activeLanguagesPerCodesMapEn = Object.assign({}, this.#allowedYandexLanguagesPerCodesMapEn);
        this.#activeLanguagesPerCodesMapRu = Object.assign({}, this.#allowedYandexLanguagesPerCodesMapRu);
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

        let result;
        await puppeteerNewTempPage(async (page) => {
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36 Edg/90.0.818.56');
            const cookies = [ { "domain": ".yandex.ru", "expirationDate": 1654705583, "hostOnly": false, "httpOnly": false, "name": "_ym_d", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "1623169584", "id": 1 }, { "domain": ".yandex.ru", "expirationDate": 1623790941, "hostOnly": false, "httpOnly": false, "name": "_ym_isad", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "1", "id": 2 }, { "domain": ".yandex.ru", "expirationDate": 1654705583, "hostOnly": false, "httpOnly": false, "name": "_ym_uid", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "1590443065968468945", "id": 3 }, { "domain": ".yandex.ru", "expirationDate": 1644538435.050017, "hostOnly": false, "httpOnly": false, "name": "amcuid", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "755091641613002433", "id": 4 }, { "domain": ".yandex.ru", "expirationDate": 1624289704, "hostOnly": false, "httpOnly": false, "name": "Bismuth", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "1", "id": 5 }, { "domain": ".yandex.ru", "expirationDate": 1624289704, "hostOnly": false, "httpOnly": false, "name": "bltsr", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "1", "id": 6 }, { "domain": ".yandex.ru", "expirationDate": 1624379185, "hostOnly": false, "httpOnly": false, "name": "computer", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "1", "id": 7 }, { "domain": ".yandex.ru", "expirationDate": 1655301395, "hostOnly": false, "httpOnly": false, "name": "gdpr", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "0", "id": 8 }, { "domain": ".yandex.ru", "expirationDate": 1672822504, "hostOnly": false, "httpOnly": true, "name": "i", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "eKwh/xBiAORIVfxiwDrgpDMuVipovdN3g7g4aNkOelRn3zKi5jek7/vQhNOu/6dUN/jDvH4WXxgaxs3yte2lN4IdvEo=", "id": 9 }, { "domain": ".yandex.ru", "expirationDate": 1624379185, "hostOnly": false, "httpOnly": false, "name": "instruction", "path": "/", "sameSite": "unspecified", "secure": false, "session": false, "storeId": "0", "value": "1", "id": 10 }, { "domain": ".yandex.ru", "expirationDate": 1678481970.414451, "hostOnly": false, "httpOnly": false, "name": "is_gdpr", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "0", "id": 11 }, { "domain": ".yandex.ru", "expirationDate": 1678481970.414536, "hostOnly": false, "httpOnly": false, "name": "is_gdpr_b", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "CNj3XxCnIigC", "id": 12 }, { "domain": ".yandex.ru", "expirationDate": 2147483648.572857, "hostOnly": false, "httpOnly": false, "name": "L", "path": "/", "sameSite": "unspecified", "secure": false, "session": false, "storeId": "0", "value": "aVYCU3hOZFBUf3J2RkZMT2BMclVgeFhGKwE1JAIgBn4QEz8c.1590443068.14245.377994.6eaf4287c33d330ac1c98204f951c83a", "id": 13 }, { "domain": ".yandex.ru", "expirationDate": 1663073860, "hostOnly": false, "httpOnly": false, "name": "mda", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "0", "id": 14 }, { "domain": ".yandex.ru", "expirationDate": 1938529585.99669, "hostOnly": false, "httpOnly": false, "name": "my", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "YwA=", "id": 15 }, { "domain": ".yandex.ru", "expirationDate": 2147483648.606737, "hostOnly": false, "httpOnly": true, "name": "Session_id", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "3:1623718939.5.0.1590443068588:bP8SBQ:a.1|197303013.-1.2.1:9542867|236049.448685.ixggamkyqzDsEE9h9K0ZkslPAwg", "id": 16 }, { "domain": ".yandex.ru", "expirationDate": 2147483648.606924, "hostOnly": false, "httpOnly": true, "name": "sessionid2", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "3:1623718939.5.0.1590443068588:bP8SBQ:a.1|197303013.-1.2.1:9542867|236049.448685.ixggamkyqzDsEE9h9K0ZkslPAwg", "id": 17 }, { "domain": ".yandex.ru", "expirationDate": 1631809585.002603, "hostOnly": false, "httpOnly": false, "name": "yabs-frequency", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "/5/0000000000000000/XGySS9800010GI6XKK5jXW0004118HTIGMs60000G44dWc51ROO00010GIFx4XnmaW00041188WF772I0000G460/", "id": 18 }, { "domain": ".yandex.ru", "expirationDate": 1625761583.179196, "hostOnly": false, "httpOnly": false, "name": "yandex_gid", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "118515", "id": 19 }, { "domain": ".yandex.ru", "expirationDate": 1655254940.607118, "hostOnly": false, "httpOnly": false, "name": "yandex_login", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "mrblond.rivz", "id": 20 }, { "domain": ".yandex.ru", "expirationDate": 1932119298.457379, "hostOnly": false, "httpOnly": false, "name": "yandexuid", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "5128788011590443036", "id": 21 }, { "domain": ".yandex.ru", "expirationDate": 1636159441.06655, "hostOnly": false, "httpOnly": false, "name": "ymex", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "1607215440.oyu.2106773731604395807#1919755821.yrts.1604395821#1919755821.yrtsi.1604395821", "id": 22 }, { "domain": ".yandex.ru", "expirationDate": 1938529585.996625, "hostOnly": false, "httpOnly": false, "name": "yp", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "1623754430.p_sw.1592218429#1905803068.udn.czo5NTQyODY3OmdnOtCU0LzQuNGC0YDQuNC5INCg0LjQstC3#1638937586.szm.1_25:1536x864:1536x754#1647862687.as.1#1623684904.mcv.0#1623684904.mct.null#1623684904.mcl.zsfn7s#1625761583.ygu.1", "id": 23 }, { "domain": ".yandex.ru", "expirationDate": 2235343441.066495, "hostOnly": false, "httpOnly": false, "name": "yuidss", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "5128788011590443036", "id": 24 }, { "domain": ".yandex.ru", "expirationDate": 1624379185, "hostOnly": false, "httpOnly": false, "name": "Zinc", "path": "/", "sameSite": "no_restriction", "secure": true, "session": false, "storeId": "0", "value": "1", "id": 25 }, { "domain": "translate.yandex.ru", "expirationDate": 1907065331.870744, "hostOnly": true, "httpOnly": false, "name": "first_visit", "path": "/", "sameSite": "unspecified", "secure": false, "session": false, "storeId": "0", "value": "1", "id": 26 }, { "domain": "translate.yandex.ru", "expirationDate": 1907065331.870676, "hostOnly": true, "httpOnly": false, "name": "first_visit_src", "path": "/", "sameSite": "unspecified", "secure": false, "session": false, "storeId": "0", "value": "internal", "id": 27 } ];
            await page.setCookie(...cookies);

            const srt = new SrtStream(text);
            const shortSrcText = srt.asTextWithoutMetadata();
            if(shortSrcText.length === 0) {
                return;
            }

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

            await page.goto(`https://translate.yandex.ru/`);

            try {
                await page.waitForSelector('#fakeArea', { visible: true, timeout: 30000 });
            } catch(e) {
                await page.screenshot({path: `./fakeArea_error.png`});
                throw e;
            }
            const inputArea = await page.$('#fakeArea');

            console.log('page loaded');

            await inputArea.evaluate((el, text) => el._insertSelectionText(text), shortSrcText);
            console.log('text inserted');

            let outputArea, output;

            await page.waitForSelector('#translation', { visible: true, timeout: 60000 });
            outputArea = await page.$('#translation');
            await page.waitForFunction('document.getElementById("translation").textContent != ""');
            output = await page.evaluate(el => el.textContent, outputArea);

            const textbox2 = await page.$(`#textbox2`);
            const defaultSelectedLangCode = await page.evaluate(el => el.getAttribute('lang'), textbox2);

            let i = 0;
            for(let langCode of langCodes) {
                if(langCode === 'en') {
                    output = shortSrcText;
                } else {
                    await page.waitForSelector('#translation', { visible: true, timeout: 60000 });
                    outputArea = await page.$('#translation');
                    const dstLangButton = await page.$('#dstLangButton');
                    await dstLangButton.click();
                    await page.waitForSelector('#dstLangListboxContent', { visible: true, timeout: 60000 });
                    const langBtn = await page.$(`#dstLangListboxContent .listbox-option[data-value=${ langCode }]`);
                    await langBtn.click();
                    await page.waitForSelector('#translation', { visible: true, timeout: 60000 });
                    outputArea = await page.$('#translation');
                    if(langCode === defaultSelectedLangCode && i === 0) {
                    } else {
                        //await waitMs(2000);
                        //await page.waitForFunction('document.getElementById("translation").textContent.split("\n")[0].split(" ")[0] != "'+ output.split("\n")[0].split(' ')[0] +'"');
                        await waitForContentNotEqual(page, '#translation', output)
                    }
                    output = await page.evaluate(el => el.textContent, outputArea);
                }
                const trans = new TranslatedStrings(shortSrcText, output);
                const transMap = trans.asJsObj();
                let outputWithMetadata = srt.asTranslatedText( transMap );

                await (new DiskFile(`./srt/${ this.#activeLanguagesPerCodesMapEn[langCode] }_${ langCode }.srt`)).write( outputWithMetadata );

                /*await (new DiskFile(`./png/readme.txt`).write( 'автоматически созданный файл для пересоздания директории' ) );
                await page.screenshot({path: `./png/${ langCode }.png`});*/

                console.log(langCode + ' - ok');
                i++;
            }

            const zip = new AdmZip();
            zip.addLocalFolder("./srt");
            zip.writeZip(`./result/${ outputFilename }.zip`);
            console.log('zipped');
            result = zip.toBuffer();
        });
        return result;
    }
}
function waitMs(val) {
    return new Promise(resolve => setTimeout(resolve, val));
}

async function waitForContentNotEqual(page, selector, trgContent) {
    return new Promise((resolve, reject) => {
        const int = setInterval(async () => {
            const el = await page.$(selector);
            const actContent = await page.evaluate(el => el.textContent, el);
            if(actContent !== trgContent) {
                clearInterval(int);
                resolve();
            }
        }, 200);
    });
}

function getObjKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}
