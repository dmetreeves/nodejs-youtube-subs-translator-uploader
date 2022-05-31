import { DiskFile } from "./lib/DiskFile.mjs";
import { google } from 'googleapis';
import readline from 'readline';

function googleDriveFileUpload(drive, diskFile, parentFolderId, fileName = undefined) {
    const resourceMetadata = {
        'name': fileName || diskFile.name(),
        parents: [parentFolderId]
    };
    const media = {
        //mimeType: 'image/jpeg',
        body: diskFile.asReadStream()
    };
    drive.files.create({
        resource: resourceMetadata,
        media: media,
        fields: 'id'
    }, function (err, resource) {
        if (err) {
            // Handle error
            console.error(err);
        } else {
            console.log('Google Drive File uploaded: ', resource.data.id);
        }
    });
}

async function withGoogleDriveFolderIdByName(drive, targetFolderName, parentFolderId, callback) {
    const folder = await googleDriveExistedFolderByName(drive, targetFolderName, parentFolderId);
    callback(folder['id']);
}

function googleDriveFolderCreateAndFindByName(drive, targetFolderName, parentFolderId) {
    return new Promise((resolve, reject) => {
        const resourceMetadata = {
            'name': targetFolderName,
            'parents': [parentFolderId],
            'mimeType': 'application/vnd.google-apps.folder'
        };
        drive.files.create({
            resource: resourceMetadata,
            fields: 'id, name'
        }, function (err, resource) {
            if (err) {
                reject(err);
            } else {
                resolve(resource.data);
            }
        });
    });
}

async function googleDriveExistedFolderByName(drive, targetFolderName, parentFolderId) {
    return await googleDriveFolderFindByName(
        drive,
        targetFolderName
    ) || await googleDriveFolderCreateAndFindByName(
        drive,
        targetFolderName,
        parentFolderId
    )

}

function googleDriveFolderFindByName(drive, folderName) {
    return new Promise((resolve, reject) => {
        drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${ folderName }'`,
            fields: 'files(id, name)'
        }, function (err, resource) {
            if (err) {
                // Handle error
                reject(err);
            } else {
                resolve(resource.data.files[0]);
            }
        });
    });
}
async function withGoogleDriveAuthedClient(creds, codeRqIntrfc, callback) {
    return withGoogleOAuth2AuthedClient(
        creds, 
        [
            'https://www.googleapis.com/auth/drive.metadata.readonly',
            'https://www.googleapis.com/auth/drive.file'
        ],
        codeRqIntrfc, 
        (oAuth2Client) => {
            return callback( google.drive({version: 'v3', auth: oAuth2Client}) );
        }
    );
}

function withYoutubeAuthedClient(creds, codeRqIntrfc, callback) {
    return withGoogleOAuth2AuthedClient(
        creds, 
        [ 'https://www.googleapis.com/auth/youtube.force-ssl' ], 
        codeRqIntrfc, 
        (oAuth2Client) => {
            return callback( google.youtube({ version: 'v3', auth: oAuth2Client }) );
        }
    );
}

function youtubeAuthedClient(creds, codeRqIntrfc) {
    return new Promise(async (resolve, reject) => {
        await withYoutubeAuthedClient(creds, codeRqIntrfc, (client) => {
            resolve(client);
        });
    });
}

function youtubeAuthedClientsList(credsList, codeRqIntrfc) {
    return new Promise(async (resolve, reject) => {
        let authedClientsList = [];
        for(let creds of credsList)
            authedClientsList.push( await youtubeAuthedClient(creds, codeRqIntrfc) );
        resolve( authedClientsList );
    });
}

async function withGoogleOAuth2AuthedClient(creds, scopes, codeRqIntrfc, callback) {
    const oAuth2Client = new google.auth.OAuth2(
        creds.client_id, creds.client_secret, creds.redirect_uri
    );
    const tokensFile = new DiskFile(`./google_auth_tokens/${ creds.client_id }.json`);
    try {
        const tokens = await googleAccessTokensFromLocalFile( tokensFile );
        oAuth2Client.setCredentials( tokens );
        await oAuth2Client.refreshToken( tokens.refresh_token );
    } catch(e) {
        const tokens = await googleAccessTokensFromApi(creds.client_id, codeRqIntrfc, scopes, oAuth2Client );
        oAuth2Client.setCredentials( tokens );
        await tokensFile.write( JSON.stringify(tokens) );
    }
    callback( oAuth2Client );
}

function googleAccessTokensFromLocalFile(localJsonFile) {
    return JSON.parse( localJsonFile.readSync() )
}

function googleAccessTokensFromApi(client_id, codeRequestInterface, scopes, oAuth2Client) {
    return new Promise(async (resolve, reject) => {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
        });
        codeRequestInterface.question(`Authorize this app ${ client_id } by visiting this url: <a href="${ authUrl }" target="_blank">click</a> . Enter the code from that page here: `, (code) => {
            console.log('code received callback', code);
            oAuth2Client.getToken(code, async (err, tokens) => {
                if (err) {
                    reject('Error retrieving access tokens: '+ err);
                    return;
                }
                resolve(tokens);
            });
        });
        
    });
}

function googleAccessTokensFromApiWithCodeFromReadlineInterface(scopes, oAuth2Client) {
    return new Promise(async (resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        const tokens = await googleAccessTokensFromApi(rl, scopes, oAuth2Client);
        rl.close();
        return tokens;
    });
}

export {
    googleDriveFileUpload,
    withGoogleDriveFolderIdByName,
    googleDriveFolderCreateAndFindByName,
    googleDriveExistedFolderByName,
    googleDriveFolderFindByName,
    withGoogleDriveAuthedClient,
    withYoutubeAuthedClient,
    youtubeAuthedClient,
    youtubeAuthedClientsList,
    withGoogleOAuth2AuthedClient,
    googleAccessTokensFromLocalFile,
    googleAccessTokensFromApi
}