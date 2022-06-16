export class TranslatedStrings {
    #src;
    #dst;
    constructor(src, dst) {
        this.#src = src;
        this.#dst = dst;
    }
    asJsObj() {
        const result = {};
        const srcArr = this.#src.split('\n\n');
        const dstArr = this.#dst.split('\n\n');
        for(let i in srcArr) {
            const srcEl = srcArr[i];
            if(srcEl === '') continue;
            result[srcEl] = dstArr[i];
        }
        return result;
    }
}