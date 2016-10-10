#!/usr/bin/env node

'use strict';

const prom = require('./index');
const http = require('http');
const argv = require('yargs').argv;

const server = http.createServer((req, res) => {
    prom.getMetrics().then((result) => {
        res.end(result);
    }, (err) => {
        console.error(err);
        res.writeHead(500);
        res.end('internal error');
    });
});

const port = Number(argv.port) || 3000;
server.listen(port);
