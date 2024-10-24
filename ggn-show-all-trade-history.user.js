// ==UserScript==
// @name         GGn Show All Trade History
// @namespace    https://gazellegames.net/
// @version      0.1
// @description  Show all hidden items on trade history
// @author       snowfudge
// @icon         https://icons.duckduckgo.com/ip3/gazellegames.net.ico
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-show-all-trade-history.user.js
// @match        https://gazellegames.net/user.php?*action=all_trades*
// ==/UserScript==

(() => {
  ("use strict");

  $("#trades_table li > a").trigger("click");
})();
