const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const v4 = require("uuid").v4;
const autopopulate = require("mongoose-autopopulate");

const UserSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    discordUsername: {
        type: String,
        required: true,
        unique: true
    },
    discordAvatar: {
        type: String,
        required: true,
        unique: true
    },
    pts: {
        type: Number,
        default: 1000
    },
    minecraftUUID: {
        type: String,
        default: null
    },
    minecraftName: {
        type: String,
        default: null
    }
});

UserSchema.statics.findOrCreateByDiscordProfile = async function (discordProfile) {
    const user = await this.findOne({
        discordId: discordProfile.id
    });

    if (user === null) {
        const u = await this.create({
            discordId: discordProfile.id,
            discordUsername: discordProfile.username,
            discordAvatar: discordProfile.avatar
        });

        await u.save();
        return u;
    }
    else {
        return user;
    }
}

UserSchema.methods.createJwt = async function () {
    const payload = {
        user: this.discordId
    }

    const token = await jwt.sign(payload, process.env.JWT_SECRET || "secret");

    return token;
}

UserSchema.statics.findByJWT = async function (token) {
    try {
        const payload = await jwt.verify(token, process.env.JWT_SECRET || "secret");
        if (!payload) return null;
        const c = await this.model('user').findOne({ discordId: payload.user });
        if (!c) return null;
        return c;
    }
    catch (e) {
        return null;
    }
}

UserSchema.methods.serialize = function () {
    return {
        _id: this._id,
        discordId: this.discordId,
        discordUsername: this.discordUsername,
        discordAvatar: this.discordAvatar,
        pts: this.pts,
        minecraft: {
            uuid: this.minecraftUUID,
            name: this.minecraftName
        }
    }
}

const User = mongoose.model("user", UserSchema);

const TeamSchema = new mongoose.Schema({
    players: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "user", required: true, autopopulate: true }], default: [], autopopulate: true }
});

TeamSchema.plugin(autopopulate);

const Team = mongoose.model("team", TeamSchema);

const MatchSchema = new mongoose.Schema({
    id: { type: String, default: v4 },
    teams: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: "team", required: true, autopopulate: true }], default: [], autopopulate: true },
    mode: { type: String, required: true },
    map: { type: String, required: true },
    status: { type: String, default: "playing" },
});

MatchSchema.plugin(autopopulate);

const Match = mongoose.model("match", MatchSchema);

const LinkCodeSchema = new mongoose.Schema({
    code: {
        type: String,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        autopopulate: true
    }
});

LinkCodeSchema.plugin(autopopulate);

const LinkCode = mongoose.model("link-code", LinkCodeSchema);

module.exports.User = User;
module.exports.Team = Team;
module.exports.Match = Match;
module.exports.LinkCode = LinkCode;