/**
 * Menethius Alpha
 * @author nosqd <nosqd@yandex.ru>
 * @license AllRightsReserved
 */

class MenethiusApi {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
        if (localStorage.jwt) {
            this.token = localStorage.jwt;
            this.socket = io.connect("/", {
                query: {token:localStorage.jwt},
                path: "/public-ws/socket.io"
            });
            
        }
    }

    async getUser() {
        if (!this.token) return null;
        const resp = await fetch(`${this.baseUrl}/auth/user`, {
            headers: { authorization: `Bearer ${this.token}` }
        });

        if (resp.status !== 200) return null;
        const data = await resp.json();
        return data;
    }

    async saveUser(token) {
        this.token = token;
        localStorage.setItem("jwt", token);
        const u = await this.getUser();
        if (!u) {
            this.token = null;
            return null;
        }
        else {
            this.socket = io.connect("/", {
                query: {token}
            });
            return u;
        }
    }

    async createLinkCode() {
        if (!this.token) return null;
        const resp = await fetch(`${this.baseUrl}/link-code`, {
            headers: { authorization: `Bearer ${this.token}` }
        });

        if (resp.status !== 200) return null;
        const data = await resp.json();
        return data;
    }


    logout() {
        localStorage.removeItem("jwt");
        document.querySelector("#user-mount").innerHTML = `<a href="/api/auth/discord" class="text-decoration-none">войти</a>`;
        this.socket.disconnect();
        if (document.body.hasAttribute("menethius-auth")) {
            location.replace("/");

        }
    }

    
}

window.menethiusApi = new MenethiusApi();


document.addEventListener("DOMContentLoaded", () => {
    Promise.all([fetch("/assets/partials/navbar.html"), fetch("/assets/partials/footer.html")])
        .then(([navbar, footer]) => (Promise.all([navbar.text(), footer.text()])))
        .then(([navbar, footer]) => {
            document.querySelector("#navbar-mount").innerHTML = navbar;
            document.querySelector("#footer-mount").innerHTML = footer;

            window.menethiusApi.getUser().then(u => {
                if (document.body.hasAttribute("menethius-auth")) {
                    if (!u) {
                        sessionStorage.setItem("redirect", "/play.html");
                        location.replace("/api/auth/discord");
                    }
                }
                if (u) {
                    document.querySelector("#user-mount").innerHTML = `<div class="dropdown" data-bs-theme="dark">
                    <button class="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                      ${u.discordUsername}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-lg-end">
                        <li><a class="dropdown-item disabled" href="#">nosqd</a></li>
                        <li><a class="dropdown-item disabled" href="#">${u.pts} PTS</a></li>
                      <li><a class="dropdown-item" href="/profile.html">Профиль</a></li>
                      <li><button class="dropdown-item dropdown-item-danger bg-danger" href="#" onclick="menethiusApi.logout()">Выйти</button></li>
                    </ul>
                  </div>`;
                }
            })
        });

    if (window.location.search) {
        const sp = new URLSearchParams(window.location.search);
        if (sp.has("jwt")) {
            const jwt = sp.get("jwt");

            window.menethiusApi.saveUser(jwt).then(u => {
                location.replace(sessionStorage.getItem("redirect") || "/");
                sessionStorage.removeItem("redirect");
            });
        }
    }
});