// ==UserScript==
// @name         GGn Forums: Autofocus on reply
// @namespace    https://gazellegames.net/
// @version      1.0
// @description  Automatically scroll down and autofocus on the textarea for quick reply
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-forums-reply-autofocus.user.js
// @match        https://gazellegames.net/forums.php?*action=viewthread&threadid=*

// ==/UserScript==

(function () {
  "use strict";

  document.getElementById("quickpost").focus();
})();
