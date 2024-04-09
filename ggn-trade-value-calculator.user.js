// ==UserScript==
// @name         GGn Trade Value Calculator
// @namespace    https://gazellegames.net/
// @version      1.3.2
// @description  This will show items value in the trade window and the estimated min/max amount of trade value required to complete a trade
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-trade-value-calculator.user.js
// @match        https://gazellegames.net/user.php?action=trade*
// ==/UserScript==

const stringToInt = (num) => {
  return parseInt(num.replace(/,/g, ""));
};

const parseNumber = (num) => {
  return Math.round(num).toLocaleString("en-US");
};

const whoNeedsFiller = (myValue, theirValue) => {
  if (myValue < theirValue) {
    requiredInfo.style.background = "rgba(255, 0, 0, 0.7)";
    return "You";
  } else {
    requiredInfo.style.background = "rgba(0, 0, 0, 0.7)";
    return "They";
  }
};

const createInfoDiv = () => {
  const div = document.createElement("div");
  div.id = "required_info";
  div.style =
    "clear: both; background: rgba(0, 0, 0, 0.5); color: #fff; padding: 10px; margin-bottom: 15px; font-size: 16px;";
  div.innerHTML = `<span></span> need around <strong></strong> worth trade value to complete this trade.`;

  document
    .querySelector(".message_box")
    .insertAdjacentElement("afterbegin", div);
};

const showItemValue = () => {
  const items = document.querySelectorAll("li.item");

  items.forEach((el) => {
    const value = el.getAttribute("data-cost");
    el.querySelector("h3").style.bottom = "15px";

    el.insertAdjacentHTML(
      "beforeend",
      `<span style="background: #000; color: #DDA82A; position: absolute; bottom: 2px; padding: 3px; left: 0; right: 0;">${parseNumber(
        value
      )}</span>`
    );
  });
};

showItemValue();
createInfoDiv();

const requiredInfo = document.getElementById("required_info");
const requiredAmount = requiredInfo.querySelector("strong");
const requiredParty = requiredInfo.querySelector("span");

(function () {
  ("use strict");

  const acceptButton = document.getElementById("accept_trade");

  const myValueEl = document.getElementById("my_trade_value_gold");
  const myValue = stringToInt(myValueEl.textContent);

  const theirValueEl = document.getElementById("other_trade_value_gold");
  const theirValue = stringToInt(theirValueEl.textContent);

  if (myValue === 0 && theirValue === 0) {
    requiredInfo.style.display = "none";
  }

  let myInitialMinValue = theirValue / 1.5,
    myInitialMaxValue = theirValue * 1.5,
    theirInitialMinValue = myValue / 1.5,
    theirInitialMaxValue = myValue * 1.5,
    initialValueInfo;

  if (myValue > theirValue) {
    // They need
    initialValueInfo = `~${parseNumber(theirInitialMinValue)} to ~${parseNumber(
      theirInitialMaxValue
    )}`;
  } else if (myValue < theirValue) {
    // I need
    initialValueInfo = `~${parseNumber(myInitialMinValue)} to ~${parseNumber(
      myInitialMaxValue
    )}`;
  }

  requiredParty.textContent = whoNeedsFiller(myValue, theirValue);
  requiredAmount.textContent = initialValueInfo;

  const obsConfig = { childList: true };
  const observer = new MutationObserver(function (mutationsList, observer) {
    observer.disconnect();

    const acceptButtonDisabled = acceptButton.hasAttribute("disabled");
    const myNewValue = stringToInt(myValueEl.textContent);

    requiredParty.textContent = whoNeedsFiller(myNewValue, theirValue);

    requiredInfo.style.display = acceptButtonDisabled ? "block" : "none";

    if (myNewValue > theirValue) {
      requiredAmount.textContent = `~${parseNumber(
        myNewValue / 1.5
      )} to ~${parseNumber(myNewValue * 1.5)}`;
    } else if (myNewValue < theirValue) {
      requiredAmount.textContent = initialValueInfo;
    }

    observer.observe(myValueEl, obsConfig);
  });
  observer.observe(myValueEl, obsConfig);
})();
