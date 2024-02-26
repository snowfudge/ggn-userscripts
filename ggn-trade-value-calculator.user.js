// ==UserScript==
// @name         GGn Trade Value Calculator
// @namespace    https://gazellegames.net/
// @version      1.0
// @description  Show the minimum required trade value when trading
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-trade-value-calculator.user.js
// @match        https://gazellegames.net/user.php?action=trade*
// ==/UserScript==

const stringToInt = (num) => {
  return parseInt(num.replace(/,/g, ""));
};

const parseNumber = (num) => {
  return num.toLocaleString("en-US");
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
  div.innerHTML = `<span></span> need around <strong></strong> of trade value to complete this trade.`;

  document
    .querySelector(".message_box")
    .insertAdjacentElement("afterbegin", div);
};

createInfoDiv();

const requiredInfo = document.getElementById("required_info");
const requiredAmount = requiredInfo.querySelector("strong");
const requiredParty = requiredInfo.querySelector("span");

(function () {
  ("use strict");

  const myValueEl = document.getElementById("my_trade_value_gold");
  let myValue = stringToInt(myValueEl.textContent);

  const theirValueEl = document.getElementById("other_trade_value_gold");
  const theirValue = stringToInt(theirValueEl.textContent);

  const minRequiredValue = parseInt(theirValue / 1.5);
  const maxRequiredValue = parseInt(theirValue * 1.5);

  if (myValue === 0 && theirValue === 0) {
    requiredInfo.style.display = "none";
  }

  requiredAmount.textContent = parseNumber(minRequiredValue);
  requiredParty.textContent = whoNeedsFiller(myValue, theirValue);

  const obsConfig = { childList: true };
  const observer = new MutationObserver(function (mutationsList, observer) {
    observer.disconnect();

    const myNewValue = stringToInt(myValueEl.textContent);
    const remainingValue = minRequiredValue - myNewValue;

    if (remainingValue >= 0) {
      requiredAmount.textContent = parseNumber(remainingValue);
      requiredInfo.style.display = "block";
    } else {
      requiredInfo.style.display = "none";
    }

    if (myNewValue > maxRequiredValue) {
      const theirMinRequiredValue = parseInt(myNewValue / 1.5);
      console.log(theirMinRequiredValue);
      requiredInfo.style.display = "block";
      requiredAmount.textContent = parseNumber(
        theirMinRequiredValue - theirValue
      );
    }

    requiredParty.textContent = whoNeedsFiller(myNewValue, theirValue);

    if (myNewValue === 0 && theirValue === 0) {
      requiredInfo.style.display = "none";
    }

    observer.observe(myValueEl, obsConfig);
  });
  observer.observe(myValueEl, obsConfig);
})();