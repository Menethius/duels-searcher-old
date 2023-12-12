const { Router } = require("express");
const DiscordOauthClient = require("../lib/discord")
const {User, Match, Team, LinkCode} = require("../lib/models");
const userMiddleware = require("../lib/middlewares/user");
const cuid = require("cuid");
const api = Router();

const client = new DiscordOauthClient(
    process.env.DISCORD_CLIENT_ID,
    process.env.DISCORD_CLIENT_SECRET,
    process.env.DISCORD_REDIRECT,
)

api.get('/auth/discord', async (req, res) => {
    res.redirect(client.createRedirectUrl(['identify', 'guilds.join']));
});

api.get('/auth/discord/redirect', async (req, res) => {
    const { code } = req.query;

    const access_token = await client.fetchAccessToken(code);
    const user = await client.getUser(access_token);
    const u = await User.findOrCreateByDiscordProfile(user);
    
    res.redirect(`/index.html?jwt=${await u.createJwt()}`);
});

api.get("/auth/user", userMiddleware, async (req, res) => {
    return res.status(200).json(req.user.serialize());
});

api.get("/match/:id", userMiddleware, async (req, res) => {
    const c = await Match.findOne({id: req.params.id});
    if (!c) return res.status(404).json(null);
    if (c.status === "playing") {
        let players = [];
        c.teams.forEach(team => players.push(...team.players));
        if (players.find(i => i.discordId === req.user.discordId)) {
            return res.json(c);
        }
        else {
            return res.status(401).json(null);
        }
    }
    else {
        return res.status(200).json(c);
    }
}); 

api.get("/link-code", userMiddleware, async (req, res) => {
    const c = await LinkCode.findOne({user: req.user._id});
    if (c) {
        return res.status(200).json(c);
    }
    else {
        const code = await LinkCode.create({
            code: cuid(),
            user: req.user._id
        });
        await code.save();
        return res.status(200).json(code);
    }
})

module.exports = api;