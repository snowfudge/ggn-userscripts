// ==UserScript==
// @name         GGn Parse Data on Items Manager
// @namespace    https://gazellegames.net/
// @version      1.0
// @description  Adds a parse data button to translate advanced strings on the items manager page
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-parse-items-manager.js
// @match        https://gazellegames.net/tools.php?action=items&item=*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @require      https://cdnjs.cloudflare.com/ajax/libs/he/1.2.0/he.min.js
// ==/UserScript==

(async function () {
  "use strict";

  let apiKey = await GM.getValue("apiKey");

  if (!apiKey) {
    if (
      !(apiKey = prompt(
        "Please enter an API key with the 'Items' permission to use this script."
      )?.trim())
    ) {
      return;
    }
    GM.setValue("apiKey", apiKey);
  }

  const endpoint = "https://gazellegames.net/api.php?request=items";
  const options = {
    method: "GET",
    mode: "same-origin",
    credentials: "omit",
    redirect: "error",
    referrerPolicy: "no-referrer",
    headers: {
      "X-API-Key": apiKey,
    },
  };

  // If no item name exist, stop here
  if (!document.getElementById("name").value) return;

  const advancedEditor = document.getElementById("packadvanced");
  const packTable = document.getElementById("pack");
  let rawPackContent = advancedEditor.value;

  // Will only work on those item packs with advanced editor showing
  if (rawPackContent) {
    // Create new row to display pack content table
    const contentRow = packTable.insertRow(3);
    let contentRowCell1 = contentRow.insertCell(0);
    let contentRowCell2 = contentRow.insertCell(1);

    contentRowCell1.style = "padding: 10px";
    contentRowCell1.textContent = "Pack Content";

    // Create button to trigger fetching data
    let button = document.createElement("button");
    button.id = "parsedata";
    button.textContent = "Parse Data";
    button.type = "button";
    button.style = "padding: 10px; height: auto; display: block;";
    button.addEventListener("click", getPackContent);

    contentRowCell2.id = "packcontent";
    contentRowCell2.style = "padding: 10px 0";
    contentRowCell2.colSpan = 3;
    contentRowCell2.appendChild(button);
  }

  async function getPackContent() {
    // Prevent double clicking!
    const parseDataButton = document.getElementById("parsedata");
    parseDataButton.disabled = true;

    const regex = /(\d{5})\*\d{5}/g;
    const matches = [...rawPackContent.matchAll(regex)];

    const packContent = matches.map((match) => match[1]);

    let itemIds = [];

    for (let i = 0; i < packContent.length; i++) {
      const itemId = packContent[i].replace(/^0+/, "");
      if (!itemIds.includes(itemId)) {
        itemIds.push(itemId);
      }
    }

    const notification = noty({
      type: "info",
      text: "Fetching data...",
      timeout: false,
    });

    const getItemData = await fetch(
      endpoint + "&itemids=[" + itemIds + "]",
      options
    );

    // Once fetching is done, close notification and remove button
    notification.close();
    parseDataButton.remove();

    if (getItemData.status === 401) {
      GM.deleteValue("apiKey");
      noty({
        type: "warning",
        text: "Invalid API key. Please refresh the page and enter a new one.",
      });
      return;
    }

    const { response: items } = await getItemData.json();

    let prettyContent = rawPackContent;

    // Loop through to find the item name based on the item ID
    for (let x = 0; x < items.length; x++) {
      const item = items[x].id;
      const itemIdString = ("00000" + item).slice(-5);

      items[x].id = itemIdString;

      prettyContent = prettyContent.replace(
        new RegExp(itemIdString, "g"),
        he.decode(items[x].name)
      );
    }

    // Add spacing for readability
    prettyContent = prettyContent.replace(/(\S)(&&|\|\|)(\S)/g, "$1 $2 $3");

    // Remove comments
    prettyContent = prettyContent.replace(/\/\*.*?\*\//g, "");

    // Add percentage if it's below 100%
    prettyContent = prettyContent.replace(
      /\*(0*)(\d{1,})/g,
      (match, zeros, num) => {
        let x = parseInt(num);
        let percentage = x === 1 ? 100 : 100 / x;

        if (percentage < 100) {
          const formattedPercentage =
            percentage % 1 === 0
              ? percentage.toFixed(0)
              : percentage.toFixed(2).replace(/\.?0+$/, "");

          return ` (${formattedPercentage}%)`;
        } else return "";
      }
    );

    // Replace || and && symbols
    prettyContent = prettyContent.replace(/&&/g, "AND").replace(/\|\|/g, "OR");

    // Create text area to display pack content
    const packContentTextArea = document.createElement("textarea");
    packContentTextArea.class = "wide_text";
    packContentTextArea.style =
      "line-height: 1.6; box-sizing: border-box; padding: 5px; width: 99%;";
    packContentTextArea.rows = 8;
    packContentTextArea.setAttribute("readonly", true);
    packContentTextArea.value = prettyContent;

    document.getElementById("packcontent").appendChild(packContentTextArea);

    // Create new row to display shop links
    const itemDataRow = packTable.insertRow(4);
    let itemDataRowCell1 = itemDataRow.insertCell(0);
    let itemDataRowCell2 = itemDataRow.insertCell(1);

    itemDataRowCell1.style = "padding: 0 0 25px; text-align: center;";
    itemDataRowCell1.textContent = "Shop Links";

    itemDataRowCell2.id = "itemdatalist";
    itemDataRowCell2.style = "padding: 0 0 25px";
    itemDataRowCell2.colSpan = 3;

    // Create a list of shop links from the items queried
    const itemDataListCell = document.getElementById("itemdatalist");
    const itemDataList = document.createElement("ul");
    itemDataList.style =
      "list-style: inside; list-style-type: none; padding-left: 5px;";

    items.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");

      const itemId = item.id.replace(/^0+/, "");

      a.target = "_blank";
      a.textContent = `${itemId}. ${he.decode(item.name)}`;
      a.href = `/shop.php?ItemID=${itemId}`;

      li.appendChild(a);
      itemDataList.appendChild(li);
    });

    itemDataListCell.appendChild(itemDataList);
  }
})();
