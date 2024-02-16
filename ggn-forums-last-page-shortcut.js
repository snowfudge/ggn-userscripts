// ==UserScript==
// @name         GGn Forums: Ctrl + ] to go to the last page
// @namespace    https://gazellegames.net/
// @version      1.0
// @description  Go to the last page in a thread using Ctrl + ]
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-forums-last-page-shortcut.js
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
