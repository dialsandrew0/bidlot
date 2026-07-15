chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    sendResponse({ ok: true });
    return;
  }

  sendResponse({ ok: false });
});
