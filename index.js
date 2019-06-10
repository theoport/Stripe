(function() {
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
  }
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
  }

  window.onload = () => {
    const expatToImmigrantSwitch = document.getElementById("expatToImmigrant");
    const immigrantToExpatSwitch = document.getElementById("immigrantToExpat");
    const markBackgroundSwitch = document.getElementById("markBackground");
    const enableSwitch = document.getElementById("enable");
    expatToImmigrantSwitch.addEventListener("click", replaceExpatWithImmigrantHandler);
    immigrantToExpatSwitch.addEventListener("click", replaceImmigrantWithExpatHandler);
    markBackgroundSwitch.addEventListener("click", markBackgroundHandler);
    enableSwitch.addEventListener("click", enableHandler);

    chrome.storage.sync.get(['stripeConfig'], ({ stripeConfig }) => {
      stripeConfig || (stripeConfig = {})
      stripeConfig.replaceExpatWithImmigrant && expatToImmigrantSwitch.setAttribute('checked', 'true');
      stripeConfig.replaceImmigrantWithExpat && immigrantToExpatSwitch.setAttribute('checked', 'true');
      stripeConfig.markBackground && markBackgroundSwitch.setAttribute('checked', 'true');
      stripeConfig.enable && enableSwitch.setAttribute('checked', 'true');
    });
  }

  function replaceExpatWithImmigrantHandler({srcElement: {checked}}) {
    setConfigAndSendMessage({'replaceExpatWithImmigrant': checked}); 
  }

  function replaceImmigrantWithExpatHandler({ srcElement: { checked } }) {
    setConfigAndSendMessage({'replaceImmigrantWithExpat': checked}); 
  }

  function markBackgroundHandler({ srcElement: { checked } }) {
    setConfigAndSendMessage({'markBackground': checked}); 
  }

  function enableHandler({ srcElement: { checked } }) {
    chrome.browserAction.setIcon(checked ? enableIconPath : disableIconPath);
    setConfigAndSendMessage({'enable': checked}); 
  }

  function setConfigAndSendMessage(newProperty) {
    chrome.storage.sync.get(['stripeConfig'], ({ stripeConfig }) => {
      chrome.storage.sync.set({'stripeConfig': {...stripeConfig, ...newProperty}}, () => {
        chrome.runtime.sendMessage({'messageType': 'update'});
      });
    });
  }
})()
