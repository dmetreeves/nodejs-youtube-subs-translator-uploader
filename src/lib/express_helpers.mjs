import { DiskFile } from './DiskFile.mjs';
import path from 'path';

function viewEngine(filePath, options, callback) {
    try {
        const layout = (new DiskFile(filePath)).readSync();
        const body = (new DiskFile(path.join(options.__dirname, '/views', `/${options.body}_body.html`))).readSync();
        const rendered = layout.toString()
            .replace('#title#', options.title)
            .replace('#body#', 
                ('' + body + '')
                .replace('#content#', '' + options.content + '')
            );
        return callback(null, rendered);
    } catch (e) {
        return callback(e);
    }
}

export {
    viewEngine
}