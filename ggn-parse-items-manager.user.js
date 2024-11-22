// ==UserScript==
// @name         GGn Parse Items Manager
// @namespace    https://gazellegames.net/
// @version      2.0
// @description  Parses the item string on the toolbox and make it readable
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-parse-items-manager.user.js
// @match        https://gazellegames.net/tools.php?action=items&item=*
// @grant        GM.getValue
// @grant        GM.setValue
// @grant        GM.deleteValue
// ==/UserScript==

let itemList = {};
let textareaId;
let itemString;
let parentSection;
let userChanceBuff;
let itemsPreChance;

const apiLimitInSeconds = 12;
const apiEndpoint = "https://gazellegames.net/api.php?request=items";
const apiOptions = {
  method: "GET",
  mode: "same-origin",
  credentials: "omit",
  redirect: "error",
  referrerPolicy: "no-referrer",
  headers: {},
};

// Fix the page for pets so it's more consistent with the rest of the page :')
$("#equipment").css({ "text-align": "left" });

// Determine if the loaded item ID is a pack / pet / normal item,
// so we can target the right element
const checkLoadedItem = () => {
  if ($("#packadvanced").length > 0) {
    textareaId = "packadvanced";
  } else if ($("#equipmentdrops").length > 0) {
    textareaId = "equipmentdrops";
  }
  parentSection = $(`#${textareaId}`).closest("tbody");
  itemString = $(`#${textareaId}`).val();
};

// Replace g**** to Gold
const parseGoldAmount = (string) => {
  return string.replace(/g(\d{4})/g, (match, amount) => {
    const goldAmount = parseInt(amount, 10);
    return `${goldAmount} Gold`;
  });
};

// If items doesn't end with multiplier, we assume it's *00001
const checkForIncompleteParantheses = (string) => {
  const regex = /\*\d{5}$/;
  if (!regex.test(string)) {
    return string + "*00001";
  }
  return string;
};

// Show the chance in %
const parseChance = (string, chance) => {
  string = string.replace(/\*\d{5}/g, (match) => {
    const baseMultiplier = parseInt(match.slice(1), 10);
    const percentage =
      chance > baseMultiplier
        ? 100
        : ((chance / baseMultiplier) * 100).toFixed(2);

    let percentFormat;

    // We use toString() so we can check if it ends with .00
    if (percentage.toString().endsWith(".00")) {
      percentFormat = parseInt(percentage, 10);
    } else {
      percentFormat = percentage;
    }

    return percentFormat == "100"
      ? ""
      : `<span style="display: inline-block; margin-left: 3px; font-size: 14px; color: #f7f307;">${percentFormat}%</span>`;
  });

  return string;
};

// Clean up string and parse into array
const parseRawDataIntoArray = (string) => {
  let parsedString = string
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove /* */ comments
    .replace(/ /g, "") // Remove double space
    //.replace(/&&/g, "\n") // Replace && with new line
    .replace(/\([^)]*\)|&&/g, (match) => {
      // If the match is a full parenthesis group, return it unchanged
      if (match.startsWith("(") && match.endsWith(")")) {
        return match;
      }
      // Otherwise, replace && with a new line
      return "\n";
    })
    .replace(/\n\s*\n/g, "\n") // Replace any two consecutive new lines with a single new line
    .replace(/\|\|\n/, "||") // Replace || followed by new line with ||
    .split("\n"); // Split string to array for every new line

  return parsedString;
};

// Break down item ranges into individual item IDs
const parseItemRange = (array) => {
  const itemIds = [];

  array.forEach((val) => {
    const pattern = /.*\d{5}-\d{5}.*/; // Check for item range
    const hasRange = pattern.test(val);

    if (hasRange) {
      const regex = /.*(\d{5})-(\d{5}).*/;
      const match = val.match(regex);
      const chance = val.slice(-6);

      const start = parseInt(match[1], 10);
      const end = parseInt(match[2], 10);

      const itemRange = [];
      for (let i = start; i <= end; i++) {
        itemRange.push(i.toString().padStart(5, "0"));
      }

      const string = itemRange.map((rangeId) => `${rangeId}*00001`).join("||");

      itemIds.push(`(${string})${chance}`);
    } else {
      itemIds.push(val);
    }
  });

  return itemIds;
};

// Where the magic happens!
const parseData = async () => {
  const now = Date.now() / 1000;
  const lastApiTimestamp = await GM.getValue("lastApiTimestamp");

  if (now - lastApiTimestamp < apiLimitInSeconds) {
    let timeRemaining = apiLimitInSeconds - Math.floor(now - lastApiTimestamp);

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

  let items = parseRawDataIntoArray(itemString);

  items = parseItemRange(items);
  items = items.map(parseGoldAmount);
  items = items.map(checkForIncompleteParantheses);

  // Save it to the global variable!
  itemsPreChance = items;

  // Get unique item ids
  const itemIds = Array.from(
    new Set(items.flatMap((val) => val.match(/\b(\d{5})\b/g) || []))
  ).map((id) => id.replace(/^0+/, "")); // Remove leading zeros

  const notification = noty({
    type: "info",
    text: "Fetching items data..",
    timeout: false,
  });

  const getItemData = await fetch(
    apiEndpoint + "&itemids=[" + itemIds + "]",
    apiOptions
  );

  if (getItemData.status === 401) {
    GM.deleteValue("apiKey");
    noty({
      type: "warning",
      text: "Invalid API key. Please refresh the page and enter a new one.",
    });
    return;
  }

  GM.setValue("lastApiTimestamp", Date.now() / 1000);

  notification.close();

  const { response } = await getItemData.json();

  itemIds.forEach((id) => {
    const result = response.find((obj) => {
      return obj.id === parseInt(id).toString();
    });
    if (result && result.name) {
      itemList[id] = result;
    }
  });

  const getUserChance = await fetch(
    apiEndpoint + "&type=users_buffs",
    apiOptions
  );

  const userResponse = await getUserChance.json();
  userChanceBuff = userResponse.response.Chance;
  $("#chance_input").val(userChanceBuff);

  if (textareaId == "packadvanced") {
    $("#item_type_pack").show();

    items = itemsPreChance.map((item) => parseChance(item, userChanceBuff));
  } else if (textareaId == "equipmentdrops") {
    $("#item_type_pet").show();

    items = itemsPreChance.map((item) => parseChance(item, 1.0));
  }

  $(".parsed_data").show();
  populateItemList(items);
};

// Where the REAL magic happens!
const populateItemList = (items) => {
  $("#parsed_content").html(""); // Clear existing content!

  const ul = document.getElementById("parsed_content");

  for (i = 0; i < items.length; i++) {
    if (items[i]) {
      const li = document.createElement("li");
      li.style =
        "display: flex; flex-wrap: wrap; align-items: center; line-height: 2; margin: 10px 0; padding: 5px 0 5px 15px; background: rgba(0, 0, 0, 0.3); border-radius: 5px;";

      if (items[i].endsWith("Gold")) {
        li.innerHTML = `${items[i]} <img style="max-height: 35px; display: inline-block; margin: 0 3px;" src="static/common/items/Items/Buff/coin_medium.png" />`;
      } else {
        li.innerHTML = items[i]
          .replace(
            /\|\|\(/g,
            `||<div style="display: flex; align-items: center;">(`
          ) // Ensures || followed by ( starts on a new line just for readability
          .replace(
            /\|\|/g,
            '<span style="display: inline-block; font-size: 15px; margin: 0 3px; color: #f73b4e;">OR</span>'
          )
          .replace(
            /\&\&/g,
            '<span style="display: inline-block; font-size: 15px; margin: 0 3px; color: #18ed18;">AND</span>'
          )
          .replace(
            /\(/g,
            '<span style="font-size: 22px; font-weight: bold; display: inline-block; margin: 0 5px 0 0;">(</span>'
          )
          .replace(
            /\)/g,
            '<span style="font-size: 22px; font-weight: bold; display: inline-block; margin: 0 5px;">)</div></span>'
          )
          .replace(/\d{5}/g, (match) => {
            const itemId = Number(match); // Without leading zero
            const item = itemList[itemId];

            return `<a class="parseLink" style="display: flex; align-items: center;" target="_blank" href="shop.php?ItemID=${itemId}">
    ${item.name}
    <img src="${item.image}" style="max-height: 35px; display: inline-block; margin: 0 3px;" />
    </a>`;
          });
      }

      ul.appendChild(li);
    }
  }
};

// Click button goes here!
const createParseButton = () => {
  const button = document.createElement("button");
  button.id = "parse_data";
  button.textContent = "Parse Data";
  button.type = "button";
  button.style = "padding: 10px; height: auto; display: block; margin: 5px 0;";
  button.addEventListener("click", parseData);

  // Create the row & column for button placement
  const tr = document.createElement("tr");
  tr.insertCell(0);
  const cell = tr.insertCell(1);
  cell.style.paddingBottom = "10px";
  cell.colSpan = 3;

  cell.appendChild(button);

  $("#" + textareaId)
    .closest("tr")
    .after(tr);
};

$("#item_builder").on("input", "#chance_input", function () {
  let value = $(this).val();

  // Remove non-numeric characters except the period
  value = value.replace(/[^0-9.]/g, "");

  // Parse the number and enforce the range
  const numericValue = parseFloat(value);
  if (!isNaN(numericValue)) {
    if (numericValue < 1.0) value = "1";
    if (numericValue > 10.0) value = "10";
  } else {
    value = ""; // Clear if invalid
  }

  // Limit decimal places to 2
  value = value.match(/^\d+(\.\d{0,2})?/)?.[0] || value;

  $(this).val(value);
});

$("#item_builder").on("click", "#my_chance", function () {
  $("#chance_input").val(userChanceBuff);
  $("#reparse_chance").trigger("click");
});

$("#item_builder").on("click", "#default_chance", function () {
  $("#chance_input").val("1.0");
  $("#reparse_chance").trigger("click");
});

$("#item_builder").on("click", "#reparse_chance", function () {
  const items = itemsPreChance.map((item) =>
    parseChance(item, $("#chance_input").val())
  );

  populateItemList(items);
});

$("#item_builder").on("change", "#pet_level", function () {
  const items = itemsPreChance.map((item) =>
    parseChance(item, $("#pet_level").val())
  );

  populateItemList(items);
});

// Template for the parsed content
const createItemInfoSection = () => {
  const html = `<tbody class="parsed_data" style="display: none;">
      <tr class="colhead">
        <td colspan="4">Parsed Content
          <a href="#" onclick="$('#parsed_item_content').toggle(); this.innerHTML = (this.innerHTML == '(Hide)' ? '(Show)' : '(Hide)'); return false">(Hide)</a>
        </td>
      </tr>
      <tr id="item_type_pack" style="display: none;">
        <td style="padding: 20px 0 0 15px;">Chance</td>
        <td colspan="3" style="padding: 20px 0 0 0;">
          <input id="chance_input" style="width: 50px;" />
          <button type="button" id="reparse_chance" style="margin: 0 5px;">Calculate</button>
          <button type="button" id="my_chance" style="margin-right: 5px;">My chance</button>
          <button type="button" id="default_chance">Default</button>
        </td>
      </tr>
      <tr id="item_type_pet" style="display: none;">
        <td style="padding: 20px 0 0 15px;">Pet Level</td>
        <td colspan="3" style="padding: 20px 0 0 0;">
         <select id="pet_level">
            <option value="1.00" id="petl0" selected>Level 0</option>
            <option value="1.00" id="petl1">Level 1</option>
            <option value="1.00" id="petl2">Level 2</option>
            <option value="1.00" id="petl3">Level 3</option>
            <option value="1.33" id="petl4">Level 4</option>
            <option value="1.66" id="petl5">Level 5</option>
            <option value="2.00" id="petl6">Level 6</option>
            <option value="2.33" id="petl7">Level 7</option>
            <option value="2.66" id="petl8">Level 8</option>
            <option value="3.00" id="petl9">Level 9</option>
            <option value="3.33" id="petl10">Level 10</option>
            <option value="3.66" id="petl1">Level 11</option>
            <option value="4.00" id="petl2">Level 12+</option>
          </select>
        </td>
    </tbody>
    <tbody class="parsed_data" style="display: none;" id="parsed_item_content">
      <tr>
        <td colspan="4" id="parsed_item_data">
          <ul id="parsed_content" style="list-style: none; padding: 0; margin: 20px 0;"></ul>
        </td>
      </tr>
    </tbody>`;

  $(parentSection).after(html);
};

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

  apiOptions.headers["X-API-Key"] = apiKey;

  checkLoadedItem();
  createItemInfoSection();
  createParseButton();
})();
