// ==UserScript==
// @name         GGn Expand Trade History
// @namespace    https://gazellegames.net/
// @version      1.1
// @description  Automatically expand all hidden items in trade history
// @author       snowfudge
// @icon         https://icons.duckduckgo.com/ip3/gazellegames.net.ico
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-show-all-trade-history.user.js
// @match        https://gazellegames.net/user.php?*action=all_trades*
// ==/UserScript==

(() => {
  ("use strict");

  $("#trades_table li > a").closest("li").remove();
  $("#trades_table div.hidden").removeClass("hidden");
})();
