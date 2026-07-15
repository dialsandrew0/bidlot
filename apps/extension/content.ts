// apps/extension/content.ts

(() => {
  const init = () => {
    if (typeof document === "undefined") {
      return;
    }

    console.log("Bidlot content script loaded");

    // TODO: wire up actual content script behavior here
    // e.g. chrome.runtime.sendMessage({ type: "CONTENT_LOADED" });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
