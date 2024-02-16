// ==UserScript==
// @name         GGn Forums: Autofocus on edit
// @namespace    https://gazellegames.net/
// @version      1.0
// @description  Autofocus on the textarea when editing a post
// @author       snowfudge
// @homepage     https://github.com/snowfudge/ggn-userscripts
// @downloadURL  https://github.com/snowfudge/ggn-userscripts/raw/main/ggn-forums-edit-autofocus.js
// @match        https://gazellegames.net/forums.php?*action=viewthread&threadid=*
// ==/UserScript==

(function () {
  "use strict";

  let postId;

  function monitorXHRRequests() {
    const activeXHRs = new Set();

    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
      const xhr = this;
      xhr.addEventListener("load", () => {
        activeXHRs.delete(xhr);
        checkAllXHRsCompleted();
      });
      xhr.addEventListener("error", () => {
        activeXHRs.delete(xhr);
        checkAllXHRsCompleted();
      });
      activeXHRs.add(xhr);
      originalOpen.apply(xhr, arguments);
    };

    function checkAllXHRsCompleted() {
      if (activeXHRs.size === 0) {
        document.getElementById(`editbox${postId}`).focus();
      }
    }
  }

  const forumPosts = document.getElementsByClassName("forum_post");

  for (let i = forumPosts.length - 1; i >= 0; i--) {
    const post = forumPosts[i];
    const regexTest = /post\d+/;

    if (regexTest.test(post.getAttribute("id"))) {
      postId = post.getAttribute("id").replace("post", "");
      const editButton = post.querySelector(`a[href="#post${postId}"]`);

      if (editButton) {
        editButton.addEventListener("click", monitorXHRRequests);
        break;
      }
    }
  }
})();
