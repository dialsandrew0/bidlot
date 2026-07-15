// apps/extension/content.ts

(() => {
  const init = () => {
    // Basic sanity check so we only run in a browser context
    if (typeof document === "undefined") {
      return;
    }

    // Log that the Bidlot content script is active
    console.log("Bidlot content script loaded");

    // Example hook: you can wire up DOM listeners or messaging here
    // chrome.runtime.sendMessage({ type: "CONTENT_LOADED" });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
