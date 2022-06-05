import { DiskFile } from "./DiskFile.mjs";
import { google } from 'googleapis';

function youtubeScopes() {
    return [ 'https://www.googleapis.com/auth/youtube.force-ssl' ];
}

function googleAccessTokensFromApi(code, oAuth2Client) {
    return new Promise(async (resolve, reject) => {
        oAuth2Client.getToken(code, (err, tokens) => {
            if (err) {
                reject('Error retrieving access tokens: '+ err);
                return;
            }
            resolve(tokens);
        });
    });
}

async function googleOAuth2AuthedClient(creds, code) {
    const oAuth2Client = new google.auth.OAuth2(
        creds.client_id, creds.client_secret, creds.redirect_uri
    );
    const tokensFile = new DiskFile(`./google_auth_tokens/${ creds.client_id }.json`);
    try {
        const tokens = JSON.parse( tokensFile.readSync() )
        oAuth2Client.setCredentials( tokens );
        await oAuth2Client.refreshToken( tokens.refresh_token );
        return oAuth2Client;
    } catch(e) {
        if(code !== undefined) {
            const tokens = await googleAccessTokensFromApi(code, oAuth2Client );
            oAuth2Client.setCredentials( tokens );
            await tokensFile.write( JSON.stringify(tokens) );
            return oAuth2Client;
        } else {
            throw e;
        }
    }
}

function googleOauthQuestionText(oAuth2Client, scopes) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
    });
    return `Авторизуйте приложение ${ oAuth2Client._clientId }, получив код <a href="${ authUrl }" target="_blank">по этой ссылке</a> . Введите полученный код здесь: `;
}

function youtubeOauthQuestionText(oAuth2Client) {
    return googleOauthQuestionText(oAuth2Client, youtubeScopes())
}

function googleAuthedClient(creds, code) {
    return googleOAuth2AuthedClient(creds, code);
}

async function googleAuthedClientList(credsList, code) {
    let authedClientsList = [];
    for(let creds of credsList) {
        try {
            authedClientsList.push( await googleAuthedClient(creds, code) );
        } catch(e) {
            //console.error(e);
        }
    }
    return authedClientsList;
}

async function youtubeAuthedClient(creds, code) {
    const oAuth2Client = await googleOAuth2AuthedClient(creds, code);
    return google.youtube({ version: 'v3', auth: oAuth2Client });
}

async function youtubeAuthedClientList(credsList, code) {
    let authedClientsList = [];
    for(let creds of credsList) {
        try {
            authedClientsList.push( await youtubeAuthedClient(creds, code) );
        } catch(e) {
            //console.error(e);
        }
    }
    return authedClientsList;
}

async function googleUnauthedClients(credsList, code) {
    const authedClients = await googleAuthedClientList( credsList, code );
    return credsList.filter(function(creds) {
        return !authedClients.reduce(function(acc, client) {
            return acc || 
                client._clientId == creds.client_id;
        }, false);
    }).map(function(unauthedCreds) {
        return new google.auth.OAuth2(
            unauthedCreds.client_id, 
            unauthedCreds.client_secret, 
            unauthedCreds.redirect_uri
        );
    });
}

function getIdFromYoutubeVideoUrl(url) {
    const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length == 11) {
        return match[2];
    } else {
        return undefined;
    }
}

export {
    googleUnauthedClients,
    youtubeOauthQuestionText,
    youtubeAuthedClientList,
    getIdFromYoutubeVideoUrl,
}