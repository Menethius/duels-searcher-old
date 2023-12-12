/**
 * Menethius Alpha
 * @author nosqd <nosqd@yandex.ru>
 * @license AllRightsReserved
 */

document.addEventListener('DOMContentLoaded', () => {
    menethiusApi.createLinkCode().then(code => {
        document.querySelector("#link-code").textContent = code.code;
    });
});