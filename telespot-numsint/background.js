/**
 * TELESPOT-NUMSINT Background Service Worker
 * Handles background operations and messaging
 */

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('TELESPOT-NUMSINT installed:', details.reason);

  // Set default settings on first install
  if (details.reason === 'install') {
    chrome.storage.local.set({
      searchHistory: [],
      settings: {
        openInBackground: true,
        searchDelay: 500,
        countryCode: '1'
      }
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SEARCH_PHONE') {
    handlePhoneSearch(message.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'GET_HISTORY') {
    chrome.storage.local.get(['searchHistory'], (result) => {
      sendResponse({ success: true, data: result.searchHistory || [] });
    });
    return true;
  }

  if (message.type === 'CLEAR_HISTORY') {
    chrome.storage.local.set({ searchHistory: [] }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Handle phone search request
async function handlePhoneSearch(data) {
  const { formats, phoneNumber } = data;

  const history = await getSearchHistory();
  history.unshift({
    phoneNumber,
    timestamp: Date.now(),
    formatsCount: formats.length
  });

  if (history.length > 50) {
    history.splice(50);
  }

  await chrome.storage.local.set({ searchHistory: history });
  return { recorded: true };
}

// Get search history from storage
async function getSearchHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['searchHistory'], (result) => {
      resolve(result.searchHistory || []);
    });
  });
}
