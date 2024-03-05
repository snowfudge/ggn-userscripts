// ==UserScript==
// @name         GGn Forums: Reply Autofocus
// @namespace    https://gazellegames.net/
// @version      1.0.1
// @description  This will scroll down to the end of the page and focus your cursor on the quick reply area
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-forums-reply-autofocus.user.js
// @match        https://gazellegames.net/forums.php?*action=viewthread&threadid=*

// ==/UserScript==

(function () {
  "use strict";

  document.getElementById("quickpost").focus();
})();
