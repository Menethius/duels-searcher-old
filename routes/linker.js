const {Router} = require("express");
const { LinkCode, User } = require("../lib/models");

const linker = Router();

linker.get("/link-account/:secret/:code/:uuid/:name", async (req, res) => {
    const {secret, code, uuid, name} = req.params;
    if (secret !== process.env.LINKER_SECRET) {
        return res.status(401).json({unauthorized: true});
    }
    const uc = await User.findOne({
        minecraftUUID: uuid

    });
    const c = await LinkCode.findOne({code});
    if (uc) {
        return res.status(200).json({message:"Ваш аккаунт уже связан с " + c.user.discordId + "\n\nОбратитесь в поддерэку", status: 401});

    }
    if (c) {
        await User.updateOne({
            _id: c.user._id
        }, {
            minecraftName: name,
            minecraftUUID: uuid
        })
        return res.status(200).json({message:"Вы связали ваш аккаунт с " + c.user.discordId, status: 200});

    }
    else {
        return res.status(401).json({message:"Код не найден.", status:401})
    }
})

module.exports = linker;