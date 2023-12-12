/**
 * Menethius Alpha
 * @author nosqd <nosqd@yandex.ru>
 * @license AllRightsReserved
 */

var queuePage = {
    searchTimeS: 0,
    searchTimeM: 0,
    searchTimeI: null,
    startSearching() {
        menethiusApi.getUser().then(user => {
            if (!user.minecraft.name || !user.minecraft.uuid) {
                alert("Вам необходимо связать свой аккаунт Menethius с аккаутом Minecraft, будет произведён автоматический переход на страницу связки.");
                location.replace("/link.html")
            }
            else {
                menethiusApi.socket.once("match-found", (match) => {
                    clearInterval(this.searchTimeI);
                    location.replace(`/match.html?id=${match.id}`)
                })
                menethiusApi.socket.emit("queue-status", (data) => {
                    if (data.status === "free") {
                        menethiusApi.socket.emit("join-queue", "1v1", (data) => {
                            if (data.error) {
                                alert(data.error)
                            }
                            else {
                                this.searchTimeI = setInterval(() => {
                                    this.searchTimeS++;
                                    if (this.searchTimeS === 60) {
                                        this.searchTimeM++;
                                        this.searchTimeS = 0;
                                    }

                                    const sS = this.searchTimeS.toString().length === 2 ? this.searchTimeS.toString() : `0${this.searchTimeS.toString()}`;
                                    const sM = this.searchTimeM.toString().length === 2 ? this.searchTimeM.toString() : `0${this.searchTimeM.toString()}`;

                                    document.querySelector("#time-m").textContent = sM;
                                    document.querySelector("#time-s").textContent = sS;
                                }, 1000);

                                document.querySelector("#startSearch-btn").classList.add("d-none");
                                document.querySelector("#startSearch-btn").classList.remove("d-block");
                                document.querySelector("#stopSearch-btn").classList.remove("d-none");
                                document.querySelector("#stopSearch-btn").classList.add("d-block");
                            }
                        })
                    }
                })
            }
        })

    },
    stopSearching() {
        menethiusApi.socket.emit("leave-queue", () => {
            document.querySelector("#startSearch-btn").classList.remove("d-none");
            document.querySelector("#startSearch-btn").classList.add("d-block");
            document.querySelector("#stopSearch-btn").classList.add("d-none");
            document.querySelector("#stopSearch-btn").classList.remove("d-block");
            document.querySelector("#time-m").textContent = "00";
            document.querySelector("#time-s").textContent = "00";
            if (this.searchTimeI) clearInterval(this.searchTimeI)
        })
    }
};

document.addEventListener("DOMContentLoaded", () => {
    menethiusApi.socket.emit("queue-status", (q) => {
        if (q.status === "ingame") {
            location.replace(`/match.html?id=${q.matchId}`)
        }
        else if (q.status === "searching") {
            queuePage.stopSearching();
        }
    })
})