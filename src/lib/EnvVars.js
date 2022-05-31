class EnvVars {
    #vars;
    constructor(src = {}) {
        this.#vars = src;
    }
    static newEmpty() {
        return new this;
    }
    oneByName(reqName) {
        let retVal, trimmedReqName = reqName.trim();
        for(let actName in this.#vars) {
            try {
                const trimmedActName = actName.trim(), trimmedActVal = this.#vars[actName].trim();
                if(trimmedActName === trimmedReqName)
                    retVal = trimmedActVal;
            } catch(e){}
        }
        return retVal;
    }
    oneByNameOrUndefined(reqName) {
        return this.oneByName(reqName);
    }
    oneByNameOrThrowErr(name) {
        const val = this.oneByNameOrUndefined(name);
        if(val === undefined)
            throw new Error(`required env var ${ name } is missing`);
        return val;
    }
    oneByNameOrDefault(name, defaultVal) {
        return this.oneByNameOrUndefined(name) || defaultVal;
    }
    boolOneByName(name) {
        const val = this.oneByNameOrUndefined(name);
        return val === true || val === 'true';
    }
    boolOneByNameOrDefault(name, defaultVal) {
        const val = this.oneByNameOrUndefined(name) || defaultVal;
        return val === true || val === 'true';
    }
}

module.exports = { EnvVars }