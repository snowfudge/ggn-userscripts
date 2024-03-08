// ==UserScript==
// @name         GGn Trade History Link on Username Dropdown
// @namespace    https://gazellegames.net/
// @version      1.0
// @description  This will show a Trade History link on your username dropdown menu
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-trade-history-on-username-dropdown.user.js
// @match        https://gazellegames.net/*
// ==/UserScript==

(function () {
  ("use strict");

  const userInfo = document.getElementById("nav_userinfo");
  const url = userInfo.querySelector("a.username").getAttribute("href");

  const params = new URLSearchParams(url.split("?")[1]);
  const userId = params.get("id");

  const dropdownMenu = document.getElementById("us_pop");
  const tradeHistoryLinkHTML = `<span><a href="user.php?action=all_trades&userid=${userId}">Trade History</a></span>`;

  dropdownMenu.insertAdjacentHTML("beforeend", tradeHistoryLinkHTML);
})();
