// ==UserScript==
// @name         GGn Forums: Reply Autofocus
// @namespace    https://gazellegames.net/
// @version      1.1
// @description  Automatically focus on quick reply in forum threads
// @author       snowfudge
// @icon         https://icons.duckduckgo.com/ip3/gazellegames.net.ico
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-forums-reply-autofocus.user.js
// @match        https://gazellegames.net/forums.php?*action=viewthread&threadid=*
// ==/UserScript==

const allowedForums = ["Forum Games"];

(function () {
  "use strict";

  const currentForum = $("#content > div.thin > h2:first-child a:eq(1)").text();

  if (allowedForums.includes(currentForum)) {
    $("#quickpost").focus();
  }
})();
