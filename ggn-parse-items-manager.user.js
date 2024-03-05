// ==UserScript==
// @name         GGn Parse Items Manager
// @namespace    https://gazellegames.net/
// @version      1.2.1
// @description  Adds a parse data button to translate advanced strings on the items manager page
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-parse-items-manager.user.js
// @match        https://gazellegames.net/tools.php?action=items&item=*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// @require      https://cdnjs.cloudflare.com/ajax/libs/he/1.2.0/he.min.js
// @require      https://unpkg.com/imask
// ==/UserScript==

(async function () {
  ("use strict");

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

  const apiLimitInSeconds = 12;
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

  const packContentsTable = document.getElementById("pack");
  const rawPackContent = document.getElementById("packadvanced").value;

  let parseDataBtn, parsedTextArea;
  let parsedContent, parsedItems;
  let userChanceBuff;

  const createParseDataRow = () => {
    const row = packContentsTable.insertRow(3);
    const cell1 = row.insertCell(0);
    const cell2 = row.insertCell(1);

    cell1.style = "padding: 10px";
    cell1.textContent = "Pack Content";

    cell2.id = "parsed_pack_content";
    cell2.style = "padding: 10px 0";
    cell2.colSpan = 3;
  };

  const createParseDataBtn = () => {
    const button = document.createElement("button");
    button.id = "parse_data";
    button.textContent = "Parse Data";
    button.type = "button";
    button.style = "padding: 10px; height: auto; display: block;";
    button.addEventListener("click", parseData);

    // Assign to global variable
    parseDataBtn = button;

    document.getElementById("parsed_pack_content").appendChild(button);
  };

  const createParsedContentArea = () => {
    // Create text area to display pack content
    const textarea = document.createElement("textarea");

    textarea.class = "wide_text";
    textarea.style =
      "line-height: 1.6; box-sizing: border-box; padding: 5px; width: 99%;";
    textarea.style.display = "none";
    textarea.rows = 8;
    textarea.setAttribute("readonly", true);

    // Assign to global variable
    parsedTextArea = textarea;

    document.getElementById("parsed_pack_content").appendChild(textarea);
  };

  const createChanceRow = () => {
    const row = packContentsTable.insertRow(4);
    let cell1 = row.insertCell(0);
    let cell2 = row.insertCell(1);

    cell1.style = "padding: 0 0 10px; text-align: center;";
    cell1.textContent = "Chance Buff";

    cell2.id = "chance_buff";
    cell2.style = "padding: 0 0 10px";
    cell2.colSpan = 3;
  };

  const createChanceInput = () => {
    const input = document.createElement("input");
    input.id = "chance_input";
    input.value = userChanceBuff;
    input.style = "margin-left: 5px; width: 50px;";
    input.type = "text";

    const mask = IMask(input, {
      mask: Number,
      radix: ".",
      mapToRadix: [","],
      min: 1,
      max: 10,
      autofix: true,
    });

    input.addEventListener("blur", function () {
      if (!this.value) this.value = 1;
      mask.updateValue();
    });

    document.getElementById("chance_buff").append(input);
  };

  const createChanceSimulateBtn = () => {
    const button = document.createElement("button");
    button.type = "button";
    button.style = "margin: 0 10px;";
    button.innerHTML = "Go";

    button.addEventListener("click", simulateChance);

    document.getElementById("chance_buff").appendChild(button);

    const myBuffButton = document.createElement("button");
    myBuffButton.type = "button";
    myBuffButton.innerHTML = "My Chance";

    myBuffButton.addEventListener("click", resetChance);

    document.getElementById("chance_buff").appendChild(myBuffButton);

    const defaultButton = document.createElement("button");
    defaultButton.type = "button";
    defaultButton.style = "margin: 0 10px;";
    defaultButton.innerHTML = "Default";

    defaultButton.addEventListener("click", defaultChance);

    document.getElementById("chance_buff").appendChild(defaultButton);
  };

  const resetChance = () => {
    document.getElementById("chance_input").value = userChanceBuff;
    parsePercentage(userChanceBuff);
  };

  const defaultChance = () => {
    document.getElementById("chance_input").value = 1;
    parsePercentage(1);
  };

  const simulateChance = () => {
    const chanceValue = document.getElementById("chance_input").value;
    const parsedValue = parseFloat(chanceValue).toFixed(2);
    parsePercentage(parsedValue);
  };

  const createShopLinksRow = () => {
    const row = packContentsTable.insertRow(5);
    let cell1 = row.insertCell(0);
    let cell2 = row.insertCell(1);

    cell1.style = "padding: 0 0 25px; text-align: center;";
    cell1.textContent = "Shop Links";

    cell2.id = "shop_links";
    cell2.style = "padding: 0 0 25px";
    cell2.colSpan = 3;
  };

  const createShopLinks = () => {
    const shop_link_cell = document.getElementById("shop_links");

    const list = document.createElement("ul");
    list.style =
      "list-style: inside; list-style-type: none; padding-left: 5px;";

    parsedItems.forEach((item) => {
      const li = document.createElement("li");
      const a = document.createElement("a");

      const itemId = item.id.replace(/^0+/, "");

      a.target = "_blank";
      a.textContent = `${itemId}. ${he.decode(item.name)}`;
      a.href = `/shop.php?ItemID=${itemId}`;

      li.appendChild(a);
      list.appendChild(li);
    });

    shop_link_cell.appendChild(list);
  };

  const parsePercentage = (chanceBuff = 1) => {
    parsedTextArea.value = parsedContent.replace(
      /\*(0*)(\d{1,})/g,
      (match, zeros, num) => {
        let x = parseInt(num);

        let percentage = chanceBuff / x === 1 ? 100 : 100 / x;
        percentage *= chanceBuff;

        if (percentage < 100) {
          const formattedPercentage =
            percentage % 1 === 0
              ? percentage.toFixed(0)
              : percentage.toFixed(2).replace(/\.?0+$/, "");

          return ` (${formattedPercentage}%)`;
        } else return "";
      }
    );
  };

  const getUserChanceBuff = async () => {
    const getUserBuffs = await (
      await fetch(endpoint + "&type=users_buffs", options)
    ).json();

    // Assign global variable
    userChanceBuff = getUserBuffs.response.Chance;
  };

  const parseData = async () => {
    const now = Date.now() / 1000;
    const lastApiTimestamp = await GM.getValue("lastApiTimestamp");

    if (now - lastApiTimestamp < apiLimitInSeconds) {
      let timeRemaining =
        apiLimitInSeconds - Math.floor(now - lastApiTimestamp);

      let timerInterval;

      const waitNotification = noty({
        type: "warning",
        text: `Please wait for ${timeRemaining} seconds.`,
        timeout: timeRemaining * 1000,
        closeWith: null,
        callback: {
          onClose: () => {
            clearInterval(timerInterval);
          },
        },
      });

      timerInterval = setInterval(() => {
        timeRemaining--;
        waitNotification.setText(`Please wait for ${timeRemaining} seconds.`);
      }, 1000);

      return;
    }

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

    parseDataBtn.disabled = true;

    const notification = noty({
      type: "info",
      text: "Fetching items data..",
      timeout: false,
    });

    const getItemData = await fetch(
      endpoint + "&itemids=[" + itemIds + "]",
      options
    );

    if (getItemData.status === 401) {
      GM.deleteValue("apiKey");
      noty({
        type: "warning",
        text: "Invalid API key. Please refresh the page and enter a new one.",
      });
      return;
    }

    await getUserChanceBuff();

    GM.setValue("lastApiTimestamp", Date.now() / 1000);

    // Once fetching is done, close notification and remove button
    notification.close();
    parseDataBtn.remove();

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

    // Make the content readable!
    prettyContent = prettyContent
      .replace(/\/\*.*?\*\//g, "") // Remove comments
      .replace(/&&/g, " AND ") // Replace && with AND
      .replace(/\|\|/g, " OR ") // Replace || with OR
      .replace(/ +/g, " "); // Remove any excess whitespace

    // Assign to global variable
    parsedItems = items;
    parsedContent = prettyContent;

    parsedTextArea.style.display = "block";
    parsedTextArea.value = prettyContent;

    createChanceRow();
    createChanceInput();
    createChanceSimulateBtn();

    parsePercentage(userChanceBuff);

    createShopLinksRow();
    createShopLinks();
  };

  createParseDataRow();
  createParseDataBtn();
  createParsedContentArea();
})();
