import fs from 'fs';

/**
 * @class DiskFile
 * Представляет файл с определенным именем на диске
 */
export class DiskFile {
    /**
     * @property {String} #fullName - Полное имя файла (с путем)
     */
    #fullName;
    #encoding;
    /**
     * @constructor
     * @param {String} fullName - Полное имя файла (с путем)
     * @param {String|null} encoding
     */
    constructor(fullName, encoding = "UTF-8") {
        this.#fullName = fullName;
        this.#encoding = encoding;
    }

    static newBinary(fullName) {
        return new this(fullName, null);
    }

    state() {
        return {
            'fullName': this.#fullName,
            'encoding': this.#encoding
        }
    }

    name() {
        const arr = this.#fullName.split('/');
        return arr[arr.length-1];
    }

    /**
     * Записывает контент в файл на диске
     * @param {string|Buffer|TypedArray|DataView} content
     */
    write(content) {
        return new Promise(async (resolve, reject) => {
            fs.mkdir(this.#fullName.split('/').slice(0,-1).join('/'), { recursive: true }, (error1) => {
                if (error1) reject(error1);
                fs.writeFile(this.#fullName, content, this.#encoding, function(error) {
                    if(error) reject(error);
                    else resolve();
                });
            });
        });
    }

    readSync() {
        return fs.readFileSync(this.#fullName, this.#encoding);
    }

    contentSync() {
        return this.readSync();
    }

    contentOrFalseSync() {
        try {
            return this.readSync();
        } catch (e) {
            return false;
        }
    }

    read() {
        const fullName = this.#fullName;
        const enc = this.#encoding;
        return new Promise(function(resolve, reject){
            fs.readFile(fullName, enc, function(error, content) {
                if(error) reject(error);
                else resolve(content);
            });
        });
    }

    content() {
        return this.read();
    }

    exists() {
        const thisFullName = this.#fullName;
        return new Promise(function(resolve){
            fs.access(thisFullName, fs.constants.F_OK, (err) => {
                resolve( !err );
            });
        });
    }

    async notExists() {
        return ! await this.exists();
    }

    delete(opts = {}) {
        const thisFullName = this.#fullName;
        return new Promise(function(resolve, reject){
            fs.rm(thisFullName, opts, function(error) {
                if(error) reject(error);
                else resolve();
            });
        });
    }
    remove(opts) {
        return this.delete(opts);
    }

    async deleteOrSkip() {
        try { await this.delete() } catch (e) {}
    }

    asReadStream() {
        return fs.createReadStream(this.#fullName);
    }
}