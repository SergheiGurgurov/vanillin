#!/usr/bin/env node
//@ts-check
import { watch } from "chokidar";
import path from 'path';
import { requireFile } from './importer.cjs';
import { getAsset, getMimeType, getServer, injectHTML, parseUrl } from './server.js';

const { server, websocket } = getServer((req, res, port) => {
    const pathName = path.join('./', parseUrl(req).pathname || '');
    const mimeType = getMimeType(req);
    try {
        let file = getAsset(pathName, mimeType);
        res.setHeader("Content-Type", mimeType);
        res.statusCode = 200;

        if (mimeType === 'text/html') {
            if (file instanceof Buffer) {
                file = file.toString();
            }
            file = injectHTML(file, {
                bodyEnd: `<script>let port = ${port}; ${requireFile("./browser/refresh.browser.js")}</script>`,
            }); // inject websocket into the html
        }

        res.write(file);
        res.end();
    } catch (error) {
        console.warn(`SERVER ERROR: could not read the requested file ${pathName}`);
        console.error(error);
        res.statusCode = 404;
        res.end();
    }
});


const listners = [];
websocket.on('connection', (ws) => {

    listners.push(ws);
    ws.on('message', (message) => {
        console.log('received: %s', message);
    });

    ws.on('close', () => {
        listners.splice(listners.indexOf(ws), 1);
    });

    ws.send('something');
});

watch('.').on('all', (event, path) => {
    listners.forEach(ws => {
        ws.send('reload');
    });
});