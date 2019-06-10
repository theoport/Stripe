'use strict';

(function() {
  const IMMIGRANT = 'immigrant';
  const MIGRANT = 'migrant';
  const EXPAT = 'expat';
  const EXPATRIATE = 'expatriate';
  const IMMIGRANT_ID = 'replacedByImmigrantdhj4GH';
  const EXPAT_ID = 'replacedByExpat34GHKKK';
  const OLD_VALUE_ATTR = 'oldValueStripe1Ghy77D';
  const DEFAULT_EXCLUDE_ELEMENTS = Object.freeze(['script', 'style', 'iframe', 'canvas']);

  let stripeConfig;

  chrome.storage.sync.get(['stripeConfig'], (result) => {
    stripeConfig = result.stripeConfig || {};
    stripeConfig.enable && init();
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
      findStripeNodesRecursive(document.body, addBackground);
    } else {
      findStripeNodesRecursive(document.body, removeBackground);
    }
  }

  function replaceExpatWithImmigrant(markBackground = false) {
    findAndReplaceRecursive(document.body, new RegExp(`${EXPATRIATE}|${EXPAT}`, 'i'), generateReplacorFunction(IMMIGRANT, markBackground, IMMIGRANT_ID))
  }

  function replaceImmigrantWithExpat(markBackground = false) {
    findAndReplaceRecursive(document.body, new RegExp(`${IMMIGRANT}|${MIGRANT}`, 'i'), generateReplacorFunction(EXPAT, markBackground, EXPAT_ID))
  }

  function revertExpatToImmigrant() {
    return findStripeNodesRecursive(document.body, revertReplacement(IMMIGRANT_ID))
  }

  function revertImmigrantToExpat() {
    return findStripeNodesRecursive(document.body, revertReplacement(EXPAT_ID))
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
      const span = document.createElement("span");
      span.className = wrapperClassName;
      span.textContent = formatNewWord(matchedWord, newWord);
      span.setAttribute(OLD_VALUE_ATTR, matchedWord);
      markBackground && changeBackgroundColor(oldBackgroundColor, span);
      return span;
    }

    return function(matchedWord, offset) {
      const newChild = this.splitText(offset);
      newChild.nodeValue = newChild.nodeValue.substring(matchedWord.length);
      this.parentNode.insertBefore(wrapReplacementWord(matchedWord, getBackgroundColor(this.parentNode)), newChild);
    }
  }

  function getBackgroundColor(node) {
    while ((node = node.parentNode) && node.style !== undefined) {
      const bckg = window.getComputedStyle(node).getPropertyValue('background-color')
      if (bckg !== "rgba(0, 0, 0, 0)") {
        return bckg;
      }
    }
    return "rgb(255, 255, 255)";
  }

  function changeBackgroundColor(oldColor, element) {
    if (isWhite(oldColor)) {
      element.style.backgroundColor = "cornsilk";
    } else {
      element.style.backgroundColor = "white";
      element.style.color = "black"
    }
  }

  function isWhite(color) {
    if (color.match(/^rgb/)) {
      const rgb = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return (rgb[1] == 255 && rgb[2] == 255 && rgb[3] == 255);
    } else if (color.match(/^#/)) {
      color = color.replace(color.length < 5 && /./g, '$&$&');
      return (color == '#FFFFFF');
    } else {
      return true;
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
    changeBackgroundColor(getBackgroundColor(stripeNode), stripeNode);
    return stripeNode;
  }

  function revertReplacement(className) {
    return function (stripeNode) {
      if (!stripeNode.classList.contains(className)) {
        return stripeNode;
      }
      const parent = stripeNode.parentNode;
      const newNode = document.createTextNode(stripeNode.getAttribute(OLD_VALUE_ATTR));
      parent.replaceChild(newNode, stripeNode);
      parent.normalize();
      return parent.firstChild;
    }
  }

  function enableOrDisable(config) {
    if (config.enable === true) {
      init();
    } else {
      (config.replaceExpatWithImmigrant === true) && revertExpatToImmigrant();
      (config.replaceImmigrantWithExpat === true) && revertImmigrantToExpat();
    }
  }

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.messageType === 'update') {
        updateHandler();
      }
      sendResponse();
      return true;
    });

  function updateHandler(){
    chrome.storage.sync.get(['stripeConfig'], ({ stripeConfig: newConfig }) => {
      if (newConfig.enable !== stripeConfig.enable) {
        enableOrDisable(newConfig);
      } else if (newConfig.enable === true) {
        updateIfChanged(newConfig);
      }
      stripeConfig = newConfig;
    });
  }

})();
