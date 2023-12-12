const client = require("../lib/redis").client;
const { User, Team, Match } = require("../lib/models")

const playersForMode = {
    "1v1": { full: 2, team: 1 }
};

const getQueueStatus = async (user) => {
    
    const modes = ['1v1'];
    let playerMode = null;
    let playerMatch = null;
    let playerTeam = null;
    await Promise.all(modes.map(async mode => {
        const players = await global.client.lRange(`${mode}.queued`, 0, -1);
        if (players.includes(user.discordId)) {
            playerMode = mode;
        }
    }));
    const matchIds = await global.client.lRange(`matches`, 0, -1);
    await Promise.all(matchIds.map(async matchId => {
        const teams = await global.client.lRange(`matches.${matchId}.teams`, 0, -1);
        for (const team of teams) {
            const players = await global.client.lRange(`matches.${matchId}.team.${team}.players`, 0, -1);
            if (players.includes(user.discordId)) {
                playerMatch = matchId;
                playerTeam = null;
            }
        }
    }));


    if (playerMode !== null && playerMatch === null) {
        return {
            status: "searching",
            mode: playerMode
        }
    }
    else if (playerMatch !== null) {
        return {
            status: "ingame",
            matchId: playerMatch,
            team: playerTeam
        }
    }
    else if (playerMode === null && playerMatch === null) {
        return {
            status: "free"
        }
    }
}

/**
 * 
 * @param {import("socket.io").Server} io 
 */
module.exports = (io) => {
    io.use(function (socket, next) {
        if (socket.handshake.query && socket.handshake.query.token) {
            User.findByJWT(socket.handshake.query.token).then(u => {
                if (u === null) {
                    next(new Error('Authentication error'));
                }
                else {
                    global.client.hSet(`socket.${socket.id}`, `user.id`, u._id.toString()).then(() => {
                        global.client.lPush(`sockets`, `${socket.id}:${u.discordId}`).then(() => {
                            next();

                        })
                    });
                }
            })
        }
        else {
            next(new Error('Authentication error'));
        }
    })
        .on('connection', function (socket) {
            global.client.hGet(`socket.${socket.id}`, `user.id`).then((user) => {
                User.findOne({
                    _id: user
                }).then(u => {
                    socket.user = u;
                    console.log(`socket@${socket.id} logged in, ${socket.user.discordUsername}`)
                })
            });
            socket.on("disconnect", async () => {
                console.log(`socket@${socket.id} logged out, ${socket.user.discordUsername}`)
                await global.client.del(`socket.${socket.id}`)
                const d = (await global.client.lRange("sockets", 0, -1)).find(i => i.split(":")[0] === socket.id);
                if (d)
                    await global.client.lRem(`sockets`, 0, d);

            });
            socket.on("queue-status", async (cb) => {
                cb(await getQueueStatus(socket.user))
            });
            socket.on("get-server-ip", async (matchId, cb) => {
                const s = await getQueueStatus(socket.user)
                if (s.status === "ingame" && s.matchId === matchId) {
                    if (await global.client.exists(`matches.${matchId}.ip`)) {

                        cb(await global.client.get(`matches.${matchId}.ip`))
                    }
                    else {

                        await global.subscriber.subscribe(`matches.${matchId}.ip-created`, (ip) => {
                            cb(ip);

                        })
                    }
                }
            })
            socket.on("join-queue", async (name, cb) => {
                if (name !== "1v1") cb({ error: "Неизвестный режим" });

                const status = await getQueueStatus(socket.user);
                if (status.status === "free") {
                    await global.client.lPush(`${name}.queued`, socket.user.discordId);

                    const queuedPlayers = await global.client.lRange(`${name}.queued`, 0, -1);
                    if (queuedPlayers.length === playersForMode[name].full) {
                        const players = queuedPlayers.slice(0, playersForMode[name].full);
                        let teams_ = [];

                        for (let i = 0; i < players.length; i += playersForMode[name].team) {
                            const team = players.slice(i, i + playersForMode[name].team);
                            teams_.push(team);
                        }

                        teams_ = await Promise.all(teams_.map(async i => await User.findOne({ discordId: i })));
                        const teams = [];
                        for (const team of teams_) {
                            const t = new Team({
                                players: team
                            })
                            await t.save();
                            teams.push(t);
                        }

                        const match = new Match({
                            map: "du_alpha",
                            mode: name,
                            teams
                        });

                        await match.save();
                        await global.client.set(`matches.${match.id}.mode`, name);
                        await global.client.set(`matches.${match.id}.map`, match.map);
                        await global.client.lPush(`matches.${match.id}.teams`, match.teams.map(i => i._id.toString()));
                        await Promise.all(match.teams.map(async team => {
                            await global.client.lPush(`matches.${match.id}.team.${team._id.toString()}.players`, team.players.map(i => i.discordId))

                        }))
                        await global.client.lPush(`matches`, match.id);

                        const sockets = await Promise.all(players.map(async discordId => (await global.client.lRange("sockets", 0, -1)).find(i => i.split(":")[1] === discordId).split(":")[0]));
                        const s = await Promise.all(sockets.map(async j => (await io.sockets.fetchSockets()).find(i => i.id === j)));

                        for (const k of players) {
                            await global.client.lRem(`${name}.queued`, 0, k);
                        }

                        s.forEach(i => i.emit("match-found", match));


                        setTimeout(async () => {
                            await global.publisher.publish(`matches.${match.id}.ip-created`, `127.0.0.1`);
                            await global.client.set(`matches.${match.id}.ip`, `127.0.0.1`)
                        }, 10000)
                    }

                    return cb(true);
                }
                else {
                    cb({ error: "Вы уже в игре или в поиске" });
                }
            });
            socket.on("leave-queue", async (cb) => {
                const status = await getQueueStatus(socket.user);

                if (status.status === "searching") {
                    await global.client.lRem(`${status.mode}.queued`, 0, socket.user.discordId);
                    return cb(true);
                }
                else {
                    cb({ error: "Вы в игре или не в поиске" });
                }
            });
        });


};