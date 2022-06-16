export class SrtStream {
    #arr = [];
    constructor(txt) {
        let subs = txt.split('\n\n');
        for(let sub of subs) {
            let subArr = sub.split('\n');
            if(subArr[0] === '')
                subArr.shift();
            if(subArr.length > 0)
                this.#arr.push(subArr);
        }
    }
    sourced() {
        return this.#arr;
    }
    asTextWithoutMetadata() {
        let result = '';
        for(let el of this.#arr) {
            if(el[2] !== undefined)
                result += (el[2] + '\n\n');
        }
        return result;
    }
    translated(map) {
        const result = [];
        const translationKeys = Object.keys(map);
        for(let el of this.#arr) {
            const newEl = [el[0], el[1]];
            const key = el[2];
            if(key !== undefined && translationKeys.includes(key))
                newEl[2] = map[key];
            result.push(newEl);
        }
        return result;
    }
    asTranslatedText(map) {
        let result = '';
        const translated = this.translated(map);
        for(let i in translated) {
            let el = translated[i];
            result += el.join('\n');
            if(i != (translated.length-1))
                result += '\n\n';
        }
        return result;
    }
}