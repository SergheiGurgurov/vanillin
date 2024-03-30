import { existsSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import http, { IncomingMessage, ServerResponse } from 'http';
import { Mime } from 'mime';
import other from 'mime/types/other.js';
import standard from 'mime/types/standard.js';
import path from 'path';
import sass from 'sass';
import ts from 'typescript';
import { parse } from 'url';
import { WebSocketServer } from "ws";
import { injectHTML } from "./node_modules/node-inject-html/dist/cjs/index.js";

const mime = new Mime(standard, other);

mime.define({
    "text/x-typescript": ["ts"],
}, true);


/**
 * 
 * @param {(req:IncomingMessage,res:ServerResponse, port:string|number)=>void} callback 
 */
function getServer(callback) {
    let port = process.env.PORT || 8080;

    const server = http.createServer(async function (req, res) {
        callback(req, res, port);
    })

    const wss = new WebSocketServer({ server });

    wss.on('error', (err) => {
        if (err.code == 'EADDRINUSE') {
            if (server.listening) {
                return;
            }
            console.info('Port 8080 is busy, using another port.');
            port = 0;
            server.listen(port);
            const addressInfo = server.address();
            if (addressInfo && typeof addressInfo === 'object') {
                port = addressInfo.port;
            }
        }
    });

    server.on('error', (err) => {
        if (err.code == 'EADDRINUSE') {
            if (server.listening) {
                return;
            }
            console.info('Port 8080 is busy, using another port.');
            port = 0;
            server.listen(port);
            const addressInfo = server.address();
            if (addressInfo && typeof addressInfo === 'object') {
                port = addressInfo.port;
            }
        }
    });

    server.on("listening", () => {
        console.info("Server listening on http://localhost:" + port);
    });

    try {
        server.listen(port);
    } catch (error) {
        console.error(error);
    }

    return { server, websocket: wss };
}

/**
 * @param {string} pathName 
 * @param {string | undefined} mimeType 
 * @returns 
 */
function getAsset(pathName, mimeType) {
    switch (mimeType) {
        case "text/x-scss": {
            if (!existsSync(`.vanillin-cache/${pathName}.css`)) {
                const transpiled = sass.renderSync({ file: `${pathName}` }).css;
                writeFileSync(`.vanillin-cache/${pathName}.css`, transpiled);
                return transpiled
            }

            const cachedInfo = lstatSync(`.vanillin-cache/${pathName}.css`);
            const originalInfo = lstatSync(`${pathName}`);
            //check if the original file has been modified
            if (originalInfo.mtimeMs > cachedInfo.mtimeMs) {
                const transpiled = sass.renderSync({ file: `${pathName}` }).css;
                writeFileSync(`.vanillin-cache/${pathName}.css`, transpiled);
                return transpiled
            }
            return readFileSync(`.vanillin-cache/${pathName}.css`);
        }
        case "text/x-typescript": {
            if (!existsSync(`.vanillin-cache/${pathName}.js`)) {
                const dir = path.dirname(pathName);
                if (!existsSync(`.vanillin-cache/${dir}`)) {
                    mkdirSync(`.vanillin-cache/${dir}`, { recursive: true });
                }
                const transpiled = ts.transpile(readFileSync(`${pathName}`).toString(), { target: ts.ScriptTarget.ES2017 });
                mkdirSync('.vanillin-cache', { recursive: true });
                writeFileSync(`.vanillin-cache/${pathName}.js`, transpiled);
                return transpiled;
            }

            const cachedInfo = lstatSync(`.vanillin-cache/${pathName}.js`);
            const originalInfo = lstatSync(`${pathName}`);
            //check if the original file has been modified
            if (originalInfo.mtimeMs > cachedInfo.mtimeMs) {
                const transpiled = ts.transpile(readFileSync(`${pathName}`).toString(), { target: ts.ScriptTarget.ES2017 });
                writeFileSync(`.vanillin-cache/${pathName}.js`, transpiled);
                return transpiled;
            }
            return readFileSync(`.vanillin-cache/${pathName}.js`);
        }
        default:
            if (existsSync(`${pathName}/index.html`)) {
                return readFileSync(`${pathName}/index.html`);
            }
            return readFileSync(`${pathName}`);
    }
}

/**
 * 
 * @param {IncomingMessage} req 
 * @returns 
 */
function getMimeType(req) {
    const res = mime.getType(req.url) || 'text/html';
    return res;
}

function parseUrl(req) {
    return parse(req.url);
}

if (!existsSync('.vanillin-cache')) {
    mkdirSync('.vanillin-cache');
}

export { getAsset, getMimeType, getServer, injectHTML, parseUrl };

