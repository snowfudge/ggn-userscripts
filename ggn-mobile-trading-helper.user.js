// ==UserScript==
// @name         GGn Mobile Trading Helper
// @namespace    https://gazellegames.net/
// @version      1.0
// @description  Add helper buttons for easier mobile trading
// @author       snowfudge
// @icon         https://icons.duckduckgo.com/ip3/gazellegames.net.ico
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-mobile-trading-helper.user.js
// @match        https://gazellegames.net/user.php?action=trade*
// ==/UserScript==

(() => {
  ("use strict");

  const addPlusButton = () => {
    $("#main-items-wrapper li.item").each(function () {
      $(this).append(
        '<button style="position: absolute; left: 0; top: 0; width: 25px; height: 25px;" class="add-item" type="button">+</button>'
      );
    });
  };
  const addRemoveButton = () => {
    $("#my-items-wrapper-table li.item").each(function () {
      $(this).append(
        '<button style="position: absolute; left: 0; top: 0; width: 25px; height: 25px;" class="remove-item" type="button">-</button>'
      );
    });
  };

  $(document).on("click", ".add-item", function (e) {
    const item = $(this).parent("li.item");

    if (typeof window.moveItem === "function") {
      if (!$(this).hasClass("exists-in-others-items")) {
        let dstPanel = "#my-items-wrapper-table";
        window.moveItem(item, 1, dstPanel, true);

        $(dstPanel).find("li.item > button").remove();
        addRemoveButton();
      }
    }
  });

  $(document).on("click", ".remove-item", function (e) {
    const item = $(this).parent("li.item");

    if (typeof window.moveItem === "function") {
      if (!$(this).hasClass("exists-in-others-items")) {
        let dstPanel = "#main-items-wrapper";
        window.moveItem(item, 1, dstPanel, true);

        $(dstPanel).find("li.item > button").remove();
        addPlusButton();
      }
    }
  });
  addPlusButton();
  addRemoveButton();
})();
