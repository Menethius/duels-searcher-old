/**
 * 
 * @param {import("socket.io").Server} io 
 */
module.exports = (io) => {
    io.use((socket, next) => {
        if (socket.handshake.query && socket.handshake.query.token === process.env.SERVERS_SECRET) {
            socket.serverId = socket.handshake.query.serverId;
            socket.serverAddress = socket.handshake.query.serverAddress;
            next();
        }
        else {
            next(new Error("secret invalid"));
        }
    }).on("connection", async (socket) => {
        console.log(`connected`, socket.serverId, socket.serverAddress)
        await global.subscriber.subscribe("check-player", async (uuid) => {
            socket.emit("check-player", uuid, (is) => {
                global.publisher.publish("checked-player:"+uuid, uuid, is, socket.serverAddress, socket.serverId)

            })

        })
    });
}