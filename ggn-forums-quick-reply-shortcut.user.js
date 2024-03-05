// ==UserScript==
// @name         GGn Forums: Quick Reply Shortcut
// @namespace    https://gazellegames.net/
// @version      1.0.1
// @description  Use Ctrl + Enter to submit your reply
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
