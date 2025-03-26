// ==UserScript==
// @name         GGn Mobile Trading
// @namespace    https://gazellegames.net/
// @version      0.1
// @description  [UNDER TESTING] Add items to trading panel with a click!
// @author       snowfudge
// @icon         https://icons.duckduckgo.com/ip3/gazellegames.net.ico
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-mobile-trading.user.js
// @match        https://gazellegames.net/user.php?action=trade*
// ==/UserScript==

(() => {
  ("use strict");

  $("#main-items-wrapper li.item").each(function () {
    $(this).append(
      '<button style="position: absolute; left: 0; top: 0; width: 25px; height: 25px;" class="add-item" type="button">+</button>'
    );
  });

  $(document).on("click", ".add-item", function (e) {
    const item = $(this).parent('li.item')
    const button = $(this);
    
    if (typeof window.moveItem === "function") {
      if (!$(this).hasClass("exists-in-others-items")) {

        let dstPanel = $(this).parent("#my-items-wrapper-table").length
          ? "#main-items-wrapper"
          : "#my-items-wrapper-table";
        window.moveItem(item, 1, dstPanel, true);

        $(dstPanel).find('li.item > button').remove();
      }
    }
  });
})();
