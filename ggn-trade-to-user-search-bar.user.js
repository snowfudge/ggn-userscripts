// ==UserScript==
// @name         GGn Trade to User Search Bar
// @namespace    https://gazellegames.net/
// @version      1.0
// @description  This will show a search bar to quickly trade with a user
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-trade-to-user-search-bar.user.js
// @match        https://gazellegames.net/*
// ==/UserScript==

(function () {
  ("use strict");

  const menuBar = document
    .getElementById("searchbars")
    .querySelector("ul:not([class]):not([id])");

  const tradeInput = document.createElement("input");
  tradeInput.id = "tradeSearch";
  tradeInput.placeholder = "Trade";
  tradeInput.value = "Trade";
  tradeInput.type = "text";

  // These are to provide focus/blur effect like the rest of the menu
  tradeInput.addEventListener("focus", (e) => {
    const el = e.target;
    const value = el.value;

    if (value == "Trade") el.value = "";
  });

  tradeInput.addEventListener("blur", (e) => {
    const el = e.target;
    const value = el.value;

    if (value == "") el.value = "Trade";
  });

  const tradeHtml = `
<li id="searchbar_trade">
  <span class="hidden">Trade: </span>
  <form class="search_form" id="tradeUserForm" action="user.php" method="get">
    <input type="hidden" name="action" value="trade" />
    <input type="hidden" name="userid" value="" />
  </form>
</li>`;

  menuBar.insertAdjacentHTML("beforeend", tradeHtml);

  const form = document.getElementById("tradeUserForm");
  form.insertAdjacentElement("beforeend", tradeInput);

  let formDisabled = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let notification;

    if (!formDisabled) {
      formDisabled = true;

      notification = noty({
        type: "info",
        text: `Searching for ${tradeInput.value}..`,
        timeout: false,
        callback: {
          onClose: function () {
            formDisabled = false;
          },
        },
      });

      $.ajax({
        type: "GET",
        dataType: "html",
        url: "ajax.php?action=users_autocomplete",
        data: { search: tradeInput.value },
      }).done((res) => {
        const response = json.decode(res);
        const username = tradeInput.value;

        const searchResult = response[1];
        const links = response[3];
        const key = searchResult.indexOf(username);
        let indexKey;

        if (searchResult.length === 1) {
          indexKey = 0;
        } else if (key !== -1) {
          indexKey = key;
        } else {
          let text, type;

          if (searchResult.length > 1) {
            text = "Multiple users found. Please specify a user to trade with.";
            type = "warning";
          } else {
            text = `User not found: ${tradeInput.value}`;
            type = "error";

            tradeInput.value = "";
          }

          notification.setText(text);
          notification.setType(type);
          notification.setTimeout(3000);
        }

        if (indexKey >= 0) {
          const url = links[indexKey];
          const params = new URLSearchParams(url.split("?")[1]);
          const id = params.get("id");

          window.location = `user.php?action=trade&userid=${id}`;
        }
      });
    }
  });
})();
