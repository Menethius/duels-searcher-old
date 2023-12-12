const express = require("express");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const http = require("http");
require("dotenv").config();
const { createClient } = require("./lib/redis")

const app = express();
const server = http.createServer(app);
const io = new Server(server, { path: "/public-ws/socket.io" });
const io2 = new Server(server, { path: "/servers-ws/socket.io" });

require("./routes/public-ws")(io);
require("./routes/servers-ws")(io2);

app.use(require("cors")());
app.use(express.json());
app.use(express.static("public"));
app.use("/api", require("./routes/api"));
app.use("/linker", require("./routes/linker"));
app.use("/servers", require("./routes/servers"));


mongoose.connect(process.env.MONGO_URL || "mongodb://127.0.0.1/menethius").then(() => {
    createClient().then(() => {
        global.client.flushAll().then(() => {
            server.listen(3000, () => {
                console.log("Menethius Duels Searcher started.")
            });
        });
    });
});
