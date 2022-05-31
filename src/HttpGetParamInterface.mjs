export class HttpGetParamInterface {
    #val;
    #res;
    #url;
    constructor(reqParams, res, url, valName) {
        this.#val = reqParams.get(valName);
        this.#res = res;
        this.#url = url;
    }
    question(text, callback) {
        const val = this.#val;
        //console.log('val', val);
        if(val !== undefined && val !== null) {
            this.#val = undefined;
            return callback(val);
        }
        else
            this.#res.end(`<form action="${ this.#url }"><p>${ text }</p><input type="text" name="code"><button>submit</button></form>`)
    }
}