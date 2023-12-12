const { createClient } = require("redis");

/**
 * @type {import("redis").RedisClientType}
 */
global.client = null
/**
 * @type {import("redis").RedisClientType}
 */
global.subscriber = null
/**
 * @type {import("redis").RedisClientType}
 */
global.publisher = null
module.exports.createClient = async () => {
    const client = await createClient(process.env.REDIS_URL || undefined).connect();
    const publisher = await createClient(process.env.REDIS_URL || undefined).connect();
    const subscriber = await createClient(process.env.REDIS_URL || undefined).connect();
    global.client = client;
    global.subscriber = subscriber;
    global.publisher = publisher;
    
}

