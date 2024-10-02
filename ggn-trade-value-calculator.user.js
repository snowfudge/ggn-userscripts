// ==UserScript==
// @name         GGn Trade Value Calculator
// @namespace    https://gazellegames.net/
// @version      2.1
// @description  Show Items' Values and Required Amount to Complete a Trade
// @author       snowfudge
// @icon         https://icons.duckduckgo.com/ip3/gazellegames.net.ico
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-trade-value-calculator.user.js
// @match        https://gazellegames.net/user.php?action=trade*
// ==/UserScript==

const stringToInt = (string) => {
  return parseInt(string.replace(/,/g, ""));
};

const parseNumber = (num) => {
  return Math.round(num).toLocaleString("en-US");
};

const myValueEl = $("#my_trade_value_gold").get(0);
const theirValue = stringToInt($("#other_trade_value_gold").text());
const requiredInfo = `<div id="required-info" style="display: none; padding: 10px 0; margin-bottom: 20px; border-radius: 8px"><span></span> need around <strong style="font-size: 16px;"></strong> worth of trade value to complete this trade.</div>`;
$(".message_box").prepend(requiredInfo);

const requiredAmount = $("#required-info").find("strong");
const requiredSide = $("#required-info").find("span");
const myInitialValue = stringToInt(myValueEl.innerText);

const parseInfo = (me, other) => {
  if (me === 0 && other === 0) {
    $("#required-info").hide();
  } else {
    $("#required-info").show();
  }

  if (me >= other) {
    $("#required-info").css("background", "#1C1C1C");
    $(requiredAmount).text(
      `${parseNumber(me / 1.5)} to ${parseNumber(me * 1.5)}`
    );
    $(requiredSide).text("They");
  } else if (me < other) {
    $("#required-info").css("background", "#B10000");
    $(requiredAmount).text(
      `${parseNumber(other / 1.5)} to ${parseNumber(other * 1.5)}`
    );
    $(requiredSide).text("You");
  }
};

(() => {
  ("use strict");

  $("li.item").each(function () {
    $(this).find("img:not(.equipment_level)").css({
      position: "absolute",
      left: 0,
      right: 0,
      "max-height": "64px",
      "max-width": "64px",
      margin: "0 auto",
    });

    $(this).find("h3").css({
      margin: 0,
      bottom: "30px",
    });

    $(this).append(
      `<span style="position: absolute; bottom: 5px; left: 0; width: 100%; color: #DDA82A;">${parseNumber(
        $(this).data("cost")
      )}</span>`
    );
  });

  parseInfo(myInitialValue, theirValue);

  const obsConfig = { childList: true };
  const observer = new MutationObserver(function (_, observer) {
    observer.disconnect();

    const myValue = stringToInt(myValueEl.innerText);

    parseInfo(myValue, theirValue);

    observer.observe(myValueEl, obsConfig);
  });

  observer.observe(myValueEl, obsConfig);
})();
