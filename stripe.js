(function() {
    const expatToImmigrantSwitch = document.getElementById("expatToImmigrant");
    const immigrantToExpatSwitch = document.getElementById("immigrantToExpat");
    const markBackgroundSwitch = document.getElementById("markBackground");

    expatToImmigrantSwitch.addEventListener("click", replaceExpatWithImmigrantHandler);
    immigrantToExpatSwitch.addEventListener("click", replaceImmigrantWithExpatHandler);
    markBackgroundSwitch.addEventListener("click", markBackgroundHandler);

    window.onload = () => {
        chrome.storage.sync.get(['stripeConfig'], ({ stripeConfig }) => {
            stripeConfig.replaceExpatWithImmigrant && expatToImmigrantSwitch.setAttribute('checked', 'true');
            stripeConfig.replaceImmigrantWithExpat && immigrantToExpatSwitch.setAttribute('checked', 'true');
            stripeConfig.markBackground && markBackgroundSwitch.setAttribute('checked', 'true');
        });
    }

    function replaceExpatWithImmigrantHandler({srcElement: {checked}}) {
        chrome.storage.sync.set({'stripeConfig': {...stripeConfig, 'replaceExpatWithImmigrant': checked}}, () => {
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    messageType: 'replaceExpatWithImmigrant',
                    state: checked
                }, function (response) {
                });
            });
        });
    };

    function replaceImmigrantWithExpatHandler({ srcElement: { checked } }) {
        chrome.storage.sync.set({'stripeConfig': {...stripeConfig, 'replaceImmigrantWithExpat': checked}}, () => {
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    messageType: 'replaceImmigrantWithExpat',
                    state: checked
                }, function (response) {
                });
            });
        });
    };

    function markBackgroundHandler({ srcElement: { checked } }) {
        chrome.storage.sync.set({'stripeConfig': { ...stripeConfig, 'markBackground': checked } }, () => {
            chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    messageType: 'markBackground',
                    state: checked
                }, function (response) {
                });
            });
        });
    }

})()
