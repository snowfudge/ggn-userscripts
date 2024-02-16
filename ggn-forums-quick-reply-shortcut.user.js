// ==UserScript==
// @name         GGn Forums: Ctrl + Enter shortcut to submit a quick reply
// @namespace    https://gazellegames.net/
// @version      1.0
// @description  Submit a quick reply using Ctrl + Enter
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-forums-quick-reply-shortcut.user.js
// @match        https://gazellegames.net/forums.php?*action=viewthread&threadid=*
// ==/UserScript==

(function () {
  "use strict";

  const form = document.getElementById("quickpostform");

  document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key === "Enter") {
      const replyDisabled = document
        .getElementById("quickpost")
        .getAttribute("disabled");
      if (!replyDisabled) {
        form.submit();
      }
    }
  });
})();
