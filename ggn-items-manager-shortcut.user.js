// ==UserScript==
// @name         GGn Items Manager Shortcut
// @namespace    https://gazellegames.net/
// @version      1.0
// @description  Add links to item manager when viewing items in inventory and shop
// @author       snowfudge
// @icon         https://icons.duckduckgo.com/ip3/gazellegames.net.ico
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-items-manager-shortcut.user.js
// @match        https://gazellegames.net/shop.php*
// @match        https://gazellegames.net/user.php*action=inventory*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Check if ItemInfo is available
  if (typeof window.ItemInfo === "function") {
    const originalItemInfo = window.ItemInfo;

    // Extend the function
    window.ItemInfo = function (id, title) {
      // We do this cause in inventory the itemId passed as args is incorrect
      const itemId = $("#" + id).attr("data-itemid");

      // Call the original function
      const result = originalItemInfo.apply(this, arguments);

      const html = `<a id="item_manager_link_${itemId}" class="ui-corner-all ui-state-default" style="width: 19px; height: 18px;" role="button" href="tools.php?action=items&item=${itemId}" target="_blank">
            <span class="ui-icon ui-icon-info">Item Manager</span>
          </a>`;

      // Get the target container
      const buttonPane = $("#" + id)
        .prev("div")
        .find(".ui-dialog-titlebar-buttonpane");

      // Check if the link is already added
      if (!buttonPane.find(`#item_manager_link_${itemId}`).length) {
        buttonPane.append(html);
      }

      return result;
    };
  }

  // For inventory
  $("div.inventory ul#items_list li.item_li").each(function () {
    const itemId = $(this).find("form").attr("data-itemid");
    const html = `<a style="float: right; width: 22px; height: 22px; color: #fff;" role="button" href="tools.php?action=items&item=${itemId}" target="_blank">
<svg fill="#b8c3ce" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="22" height="22" viewBox="0 0 24 24">
    <path d="M12,2C6.477,2,2,6.477,2,12s4.477,10,10,10s10-4.477,10-10S17.523,2,12,2z M13,17h-2v-6h2V17z M13,9h-2V7h2V9z"></path>
</svg>
          </a>`;
    $(this).find(".trash_icon").after(html);
  });
})();
