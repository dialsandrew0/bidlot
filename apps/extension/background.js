// bidlot — Chrome MV3 background service worker
// apps/extension/background.js
// Listens for the extension icon click and injects content.js
// into the active CTBids watchlist tab.

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  const url = tab.url || "";
  if (!url.includes("ctbids.com/watching")) {
    // Notify the user they need to be on the watchlist page
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        alert(
          "bidlot: Please navigate to your CTBids Watchlist first.\n" +
          "Go to ctbids.com/watching and click the extension again."
        );
      },
    });
    return;
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"],
    });
  } catch (err) {
    console.error("[bidlot] Failed to inject content script:", err);
  }
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "BIDLOT_IMPORT_COMPLETE") {
    console.log("[bidlot] Import complete:", message.count, "lots sent.");
    sendResponse({ ok: true });
  }
  return true;
});
