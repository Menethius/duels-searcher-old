const axios = require("axios");

class DiscordOauthClient {
    constructor(client_id, client_secret, redirect_url) {
        this.client_id = client_id;
        this.client_secret = client_secret;
        this.redirect_url = redirect_url;
    }

    createRedirectUrl(scopes) {
        return `https://discord.com/oauth2/authorize?response_type=code&client_id=${this.client_id}&scope=${scopes.join('%20')}&redirect_uri=${this.redirect_url}`;
    }

    async fetchAccessToken(code) {
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', process.env.DISCORD_REDIRECT);
        const { data: { access_token } } = await axios.post("https://discord.com/api/v10/oauth2/token", params, {
            auth: {
                username: process.env.DISCORD_CLIENT_ID,
                password: process.env.DISCORD_CLIENT_SECRET
            }
        });
        return access_token;
    }

    async getUser(access_token) {
        const { data } = await axios.get("https://discord.com/api/v10/users/@me", {
            headers: {
                authorization: `Bearer ${access_token}`
            }
        });
        return data;
    }
}

module.exports = DiscordOauthClient;