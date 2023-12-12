/**
 * Menethius Alpha
 * @author nosqd <nosqd@yandex.ru>
 * @license AllRightsReserved
 */

var matchPage = {
    async loadMatch(matchId) {
        const match = await (await fetch(`/api/match/${matchId}`, {headers: {authorization: `Bearer ${menethiusApi.token}`}})).json()

        const res = `  
            ${match.teams[0].players.map(p => `<div class="col"><img src="https://cdn.discordapp.com/avatars/${p.discordId}/${p.discordAvatar}.png?size=128" class="rounded" width="128"><p class="fs-3">${p.discordUsername}</p><p class="fs-4">${p.pts} PTS</p></div>`).join('\n')}
            <div class="col-6">
                <input type="text" class="form-group form-control text-center" readonly disabled value="ОЖИДАНИЕ" id="serverIp">
            </div>
            ${match.teams[1].players.map(p => `<div class="col"><img src="https://cdn.discordapp.com/avatars/${p.discordId}/${p.discordAvatar}.png?size=128" class="rounded" width="128"><p class="fs-3">${p.discordUsername}</p><p class="fs-4">${p.pts} PTS</p></div>`).join('\n')}
        </div>`;

        document.querySelector("#players-mount").innerHTML = res;

        if (match.status === "playing") {
            menethiusApi.socket.emit("get-server-ip", matchId, (ip) => {
                document.querySelector("#serverIp").value = ip;
            })
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const sp = new URLSearchParams(location.search)
    matchPage.loadMatch(sp.get("id"))
})