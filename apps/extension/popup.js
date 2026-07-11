// bidlot — extension popup script
// apps/extension/popup.js

const importBtn = document.getElementById('importBtn');
const statusEl = document.getElementById('status');
const lastImportEl = document.getElementById('lastImport');

// Load last import time from storage
chrome.storage.local.get(['extractedAt', 'lastExtract'], (data) => {
  if (data.extractedAt) {
    const d = new Date(data.extractedAt);
    const count = data.lastExtract ? data.lastExtract.length : 0;
    lastImportEl.textContent =
      `Last import: ${count} lots at ${d.toLocaleTimeString()}`;
  }
});

function setStatus(msg, type = '') {
  statusEl.textContent = msg;
  statusEl.className = 'status-box' + (type ? ' ' + type : '');
}

importBtn.addEventListener('click', async () => {
  importBtn.disabled = true;
  setStatus('Scanning watchlist…', 'loading');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url?.includes('ctbids.com/watching')) {
      setStatus(
        'Navigate to ctbids.com/watching first, then click Import.',
        'error'
      );
      importBtn.disabled = false;
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js'],
    });

    // Poll storage for the result
    let attempts = 0;
    const poll = setInterval(() => {
      chrome.storage.local.get(['extractedAt', 'lastExtract'], (data) => {
        if (data.lastExtract && data.lastExtract.length > 0) {
          clearInterval(poll);
          const count = data.lastExtract.length;
          setStatus(
            `Sent ${count} lots to your bidlot dashboard!`,
            'success'
          );
          lastImportEl.textContent =
            `Last import: ${count} lots at ${new Date().toLocaleTimeString()}`;
          importBtn.disabled = false;
        }
      });
      attempts++;
      if (attempts > 20) {
        clearInterval(poll);
        setStatus('Import timed out. Try again.', 'error');
        importBtn.disabled = false;
      }
    }, 500);

  } catch (err) {
    setStatus(`Error: ${err.message}`, 'error');
    importBtn.disabled = false;
  }
});
