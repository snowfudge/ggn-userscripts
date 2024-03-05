// ==UserScript==
// @name         GGn Forums: Quick Edit Shortcut
// @namespace    https://gazellegames.net/
// @version      1.0.1
// @description  Use Ctrl + Enter to submit your post once you are done editing
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-forums-quick-edit-shortcut.user.js
// @match        https://gazellegames.net/forums.php?*action=viewthread&threadid=*
// ==/UserScript==

(function () {
  "use strict";

  document.addEventListener("keydown", function (event) {
    if (event.ctrlKey && event.key === "Enter") {
      // Look for textarea
      const textareas = document.querySelectorAll("textarea");

      for (let i = 0; i <= textareas.length; i++) {
        const textarea = textareas[i];

        if (textarea) {
          const getId = textarea.getAttribute("id");
          const regex = /^(editbox\d+)$/;

          const isEditTextarea = regex.test(getId);

          if (isEditTextarea) {
            const postId = getId.replace("editbox", "");
            const submitDiv = document.getElementById(`bar${postId}`);

            const submitEditButton = submitDiv.querySelector(
              'input[type="button"][value="Post"]'
            );

            submitEditButton.click();
            break;
          }
        }
      }
    }
  });
})();
