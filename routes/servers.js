const { Router } = require("express");
const { LinkCode, User } = require("../lib/models");

const servers = Router();
require('express-ws')(servers);

servers.post("/node-servers/:secret", async (req, res) => {
    const servers = req.body;
    console.log(servers);
    res.end();
});

servers.ws('/ws', (ws, req) => {
    ws.on('message', (msg) => {
        console.log(msg)
    });
    console.log(req.query)
});

module.exports = servers;