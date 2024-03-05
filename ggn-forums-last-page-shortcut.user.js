// ==UserScript==
// @name         GGn Forums: Last Oage Shortcut
// @namespace    https://gazellegames.net/
// @version      1.0.1
// @description  Use Ctrl + ] to go to the last page of the forum thread you're in
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-forums-last-page-shortcut.user.js
// @match        https://gazellegames.net/forums.php?*action=viewthread&threadid=*
// ==/UserScript==

(function () {
  "use strict";

  const linkBox = document.querySelector(".linkbox");

  const pageLinks = linkBox.querySelectorAll("a");
  const pageLinksCount = pageLinks.length;

  const lastLink = pageLinks[pageLinksCount - 1];

  document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key === "]") {
      if (lastLink.querySelector("strong").innerHTML === " Last &gt;&gt;") {
        lastLink.click();
      }
    }
  });
})();
