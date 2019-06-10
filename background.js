const disableIconPath = {
  path: {
    "16": "assets/Stripe3-16.png",
    "19": "assets/Stripe3-19.png",
    "32": "assets/Stripe3-32.png",
    "38": "assets/Stripe3-38.png",
    "48": "assets/Stripe3-48.png",
    "64": "assets/Stripe3-64.png",
    "128": "assets/Stripe3-128.png"
  }
};
const enableIconPath = {
  path: {
    "16": "assets/Stripe2-16.png",
    "19": "assets/Stripe2-19.png",
    "32": "assets/Stripe2-32.png",
    "38": "assets/Stripe2-38.png",
    "48": "assets/Stripe2-48.png",
    "64": "assets/Stripe2-64.png",
    "128": "assets/Stripe2-128.png"
  }
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, request)
  });
  sendResponse();
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.sendMessage(tabId, {'messageType': 'update'})
});

chrome.storage.sync.get(['globalConfig'], ({ globalConfig }) => {
  chrome.browserAction.setIcon(globalConfig.enable ? enableIconPath : disableIconPath);
});
