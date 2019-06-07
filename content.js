'use strict';

(function() {
    const IMMIGRANT = 'immigrant';
    const EXPAT = 'expat';
    const IMMIGRANT_ID = 'replacedByImmigrantdhj4GH';
    const EXPAT_ID = 'replacedByExpat34GHKKK';
    const OLD_VALUE_ATTR = 'oldValueStripe1Ghy77D';
    const DEFAULT_EXCLUDE_ELEMENTS = Object.freeze(['script', 'style', 'iframe', 'canvas']);

    let stripeConfig;

    chrome.storage.sync.get(['stripeConfig'], (result) => {
        stripeConfig = result.stripeConfig || {};
        init();
    });
    function init() {
        (stripeConfig.replaceExpatWithImmigrant === true) && replaceExpatWithImmigrant(stripeConfig.markBackground);
        (stripeConfig.replaceImmigrantWithExpat === true) && replaceImmigrantWithExpat(stripeConfig.markBackground);
    }

    function updateIfChanged(newConfig) {
        if (newConfig.replaceImmigrantWithExpat !== stripeConfig.replaceImmigrantWithExpat) {
            replaceImmigrantWithExpatToggle(newConfig.replaceImmigrantWithExpat);
        }
        if (newConfig.replaceExpatWithImmigrant !== stripeConfig.replaceExpatWithImmigrant) {
            replaceExpatWithImmigrantToggle(newConfig.replaceImmigrantWithExpat);
        }
        if (newConfig.markBackground !== stripeConfig.markBackground) {
            markBackgroundToggle(newConfig.markBackground);
        }
    }

    function replaceExpatWithImmigrantToggle(checked) {
        if (checked === true) {
            replaceExpatWithImmigrant(stripeConfig.markBackground)
        } else {
            revertExpatToImmigrant();
        }
    }

    function replaceImmigrantWithExpatToggle(checked) {
        if (checked === true) {
            replaceImmigrantWithExpat(stripeConfig.markBackground);
        } else {
            revertImmigrantToExpat();
        }
    }

    function markBackgroundToggle(checked) {
        if (checked === true) {
            findStripeNodesRecursive(document.body, addBackground());
        } else {
            findStripeNodesRecursive(document.body, removeBackground);
        }
    }

    function replaceExpatWithImmigrant(markBackground = false) {
        findAndReplaceRecursive(document.body, new RegExp(EXPAT, 'i'), generateReplacorFunction(IMMIGRANT, markBackground, IMMIGRANT_ID))
    }

    function replaceImmigrantWithExpat(markBackground = false) {
        findAndReplaceRecursive(document.body, new RegExp(IMMIGRANT, 'i'), generateReplacorFunction(EXPAT, markBackground, EXPAT_ID))
    }

    function revertExpatToImmigrant() {
        return findStripeNodesRecursive(document.body, revertReplacement(EXPAT_ID))
    }

    function revertImmigrantToExpat() {
        return findStripeNodesRecursive(document.body, revertReplacement(IMMIGRANT_ID))
    }

    function findAndReplaceRecursive(node, regex, replaceWithWrapped, excludeElements = DEFAULT_EXCLUDE_ELEMENTS) {
        let child = node.firstChild || {};
        do {
            switch (child.nodeType) {
                case (Node.ELEMENT_NODE):
                    if (excludeElements.includes(child.tagName.toLowerCase()) || child.hasAttribute(OLD_VALUE_ATTR)) {
                        continue;
                    }
                    findAndReplaceRecursive(child, regex, replaceWithWrapped, excludeElements)
                    break;
                case (Node.TEXT_NODE):
                    child.nodeValue.replace(regex, replaceWithWrapped.bind(child));
                    break;
            }
        } while (child = child.nextSibling)
    }

    function formatNewWord(matchedWord, newWord) {
        newWord = newWord.toLowerCase();
        if (matchedWord === matchedWord.toUpperCase()) {
            return newWord.toUpperCase();
        } else {
            return matchedWord[0] === matchedWord[0].toUpperCase() ?
                newWord[0].toUpperCase() + newWord.substring(1)
                : newWord;
        }
    }

    function generateReplacorFunction(newWord, markBackground, wrapperClassName) {
        function wrapReplacementWord(matchedWord, oldBackgroundColor) {
            let span = document.createElement("span");
            span.className = wrapperClassName;
            span.textContent = formatNewWord(matchedWord, newWord);
            span.setAttribute(OLD_VALUE_ATTR, matchedWord);
            markBackground && changeBackgroundColor(oldBackgroundColor, span);
            return span;
        }

        return function (matchedWord, offset) {
            let newChild = this.splitText(offset);
            newChild.nodeValue = newChild.nodeValue.substring(matchedWord.length);
            this.parentNode.insertBefore(wrapReplacementWord(matchedWord, this.parentNode.style.backgroundColor), newChild);
        }
    }

    function changeBackgroundColor(oldColor, element) {
        if (oldColor === "" || oldColor === "white") {
            element.style.backgroundColor = "cornsilk";
        } else {
            element.style.backgroundColor = "white";
            element.style.color = "black"
        }
    }

    function findStripeNodesRecursive(node, transformNode, excludeElements = DEFAULT_EXCLUDE_ELEMENTS) {
        let child = node.firstChild || {};
        do {
            if (child.nodeType === Node.ELEMENT_NODE && !excludeElements.includes(child.tagName.toLowerCase())) {
                if (child.hasAttribute(OLD_VALUE_ATTR)) {
                    child = transformNode(child);
                } else {
                    findStripeNodesRecursive(child, transformNode, excludeElements);
                }
            }
        } while (child = child.nextSibling)
    }

    function removeBackground(stripeNode) {
        stripeNode.style.backgroundColor = null;
        stripeNode.style.color = null;
        return stripeNode;
    }

    function addBackground(stripeNode) {
        changeBackgroundColor(stripeNode.parentNode.style.backgroundColor, stripeNode);
        return stripeNode;
    }

    function revertReplacement(className) {
        return function (stripeNode) {
            if (!stripeNode.classList.contains(className)) {
                return stripeNode;
            }
            let parent = stripeNode.parentNode;
            let newNode = document.createTextNode(stripeNode.getAttribute(OLD_VALUE_ATTR));
            parent.replaceChild(newNode, stripeNode);
            parent.normalize();
            return parent.firstChild;
        }
    }

    chrome.runtime.onMessage.addListener(
        function(request, sender) {
            console.log(sender);
            switch(request.messageType) {
                case 'replaceImmigrantWithExpat':
                    replaceExpatWithImmigrantToggle(request.state);
                    break;
                case 'replaceExpatWithImmigrant':
                    replaceImmigrantWithExpatToggle(request.state);
                    break;
                case 'markBackground':
                    markBackgroundToggle(request.state);
                    break;
            }
        });

    chrome.tabs.onActivated.addListener(() => {
        chrome.storage.sync.get(['stripeConfig'], ({result: {stripeConfig: newConfig}}) => {
            updateIfChanged(newConfig);
            stripeConfig = newConfig;
        });
    });

})();
