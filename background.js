chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, request)
    });
    sendResponse();
});
chrome.tabs.onActivated.addListener(({ tabId }) => {
    chrome.tabs.sendMessage(tabId, {'messageType': 'update'})
});
