'use strict';

(function() {
  const IMMIGRANT = 'immigrant';
  const MIGRANT = 'migrant';
  const EXPAT = 'expat';
  const EXPATRIATE = 'expatriate';
  const IMMIGRANT_ID = 'replacedByImmigrantdhj4GH';
  const EXPAT_ID = 'replacedByExpat34GHKKK';
  const OLD_VALUE_ATTR = 'oldValue1Ghy77D';
  const GLOBAL_CONFIG = 'globalConfig';
  const DEFAULT_EXCLUDE_ELEMENTS = Object.freeze(['script', 'style', 'iframe', 'canvas']);

  let localConfig;

  chrome.storage.sync.get([GLOBAL_CONFIG], ({ globalConfig }) => {
    localConfig = globalConfig || {};
    localConfig.enable && init();
  });

  function init() {
    (localConfig.replaceExpatWithImmigrant === true) && replaceExpatWithImmigrant(localConfig.markBackground);
    (localConfig.replaceImmigrantWithExpat === true) && replaceImmigrantWithExpat(localConfig.markBackground);
  }

  function updateIfChanged(newConfig) {
    if (newConfig.replaceImmigrantWithExpat !== localConfig.replaceImmigrantWithExpat) {
      replaceImmigrantWithExpatToggle(newConfig.replaceImmigrantWithExpat);
    }
    if (newConfig.replaceExpatWithImmigrant !== localConfig.replaceExpatWithImmigrant) {
      replaceExpatWithImmigrantToggle(newConfig.replaceExpatWithImmigrant);
    }
    if (newConfig.markBackground !== localConfig.markBackground) {
      markBackgroundToggle(newConfig.markBackground);
    }
  }

  function replaceExpatWithImmigrantToggle(checked) {
    checked ? 
      replaceExpatWithImmigrant(localConfig.markBackground) 
      : revertExpatToImmigrant();
  }

  function replaceImmigrantWithExpatToggle(checked) {
    checked ? 
      replaceImmigrantWithExpat(localConfig.markBackground) 
      : revertImmigrantToExpat();
  }

  function markBackgroundToggle(checked) {
    checked ? 
      findAddedNodesRecursive(document.body, addBackground) 
      : findAddedNodesRecursive(document.body, removeBackground);
  }

  function replaceExpatWithImmigrant(markBackground = false) {
    findAndReplaceRecursive(document.body, new RegExp(`${EXPATRIATE}|${EXPAT}`, 'i'), 
      generateReplacorFunction(IMMIGRANT, markBackground, IMMIGRANT_ID))
  }

  function replaceImmigrantWithExpat(markBackground = false) {
    findAndReplaceRecursive(document.body, new RegExp(`${IMMIGRANT}|${MIGRANT}`, 'i'), 
      generateReplacorFunction(EXPAT, markBackground, EXPAT_ID))
  }

  function revertExpatToImmigrant() {
    return findAddedNodesRecursive(document.body, revertReplacement(IMMIGRANT_ID))
  }

  function revertImmigrantToExpat() {
    return findAddedNodesRecursive(document.body, revertReplacement(EXPAT_ID))
  }

  function findAndReplaceRecursive(node, regex, replaceWithWrapped, excludeElements = DEFAULT_EXCLUDE_ELEMENTS) {
    let child = node.firstChild || {};
    do switch (child.nodeType) {
      case (Node.ELEMENT_NODE):
        if (excludeElements.includes(child.tagName.toLowerCase()) || child.hasAttribute(OLD_VALUE_ATTR)) {
          continue;
        }
        findAndReplaceRecursive(child, regex, replaceWithWrapped, excludeElements);
        break;
      case (Node.TEXT_NODE):
        child.nodeValue.replace(regex, replaceWithWrapped.bind(child));
        break;
    } while (child = child.nextSibling)
  }

  function formatNewString(match, newString) {
    newString = newString.toLowerCase();
    if (match === match.toUpperCase()) {
      return newString.toUpperCase();
    } else {
      return match[0] === match[0].toUpperCase() ?
        newString[0].toUpperCase() + newString.substring(1)
        : newString;
    }
  }

  function generateReplacorFunction(newString, markBackground, tagClassName) {
    function wrapNewStringInSpanTag(match, oldBackgroundColor) {
      const span = document.createElement("span");
      span.className = tagClassName;
      span.textContent = formatNewString(match, newString);
      span.setAttribute(OLD_VALUE_ATTR, match);
      markBackground && changeBackgroundColor(oldBackgroundColor, span);
      return span;
    }

    return function(match, offset) {
      const newChild = this.splitText(offset);
      newChild.nodeValue = newChild.nodeValue.substring(match.length);
      this.parentNode.insertBefore(wrapNewStringInSpanTag(match, getBackgroundColor(this.parentNode)), newChild);
    }
  }

  function getBackgroundColor(node) {
    while ((node = node.parentNode) && node.style !== undefined) {
      const bckg = window.getComputedStyle(node).getPropertyValue('background-color');
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
      return (rgb[1] === '255' && rgb[2] === '255' && rgb[3] === '255');
    } else if (color.match(/^#/)) {
      color = color.replace(color.length < 5 && /./g, '$&$&');
      return (color === '#FFFFFF');
    } else {
      return true;
    }
  }

  function findAddedNodesRecursive(node, transformNode, excludeElements = DEFAULT_EXCLUDE_ELEMENTS) {
    let child = node.firstChild || {};
    do {
      if (child.nodeType === Node.ELEMENT_NODE && !excludeElements.includes(child.tagName.toLowerCase())) {
        if (child.hasAttribute(OLD_VALUE_ATTR)) {
          child = transformNode(child);
        } else {
          findAddedNodesRecursive(child, transformNode, excludeElements);
        }
      }
    } while (child = child.nextSibling)
  }

  function removeBackground(node) {
    node.style.backgroundColor = null;
    node.style.color = null;
    return node;
  }

  function addBackground(node) {
    changeBackgroundColor(getBackgroundColor(node), node);
    return node;
  }

  function revertReplacement(className) {
    return function (node) {
      if (!node.classList.contains(className)) {
        return node;
      }
      const parent = node.parentNode;
      const newNode = document.createTextNode(node.getAttribute(OLD_VALUE_ATTR));
      parent.replaceChild(newNode, node);
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

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.messageType === 'update') {
        updateHandler();
      }
      sendResponse();
      return true;
    });

  function updateHandler(){
    chrome.storage.sync.get([GLOBAL_CONFIG], ({ globalConfig: newConfig }) => {
      if (newConfig.enable !== localConfig.enable) {
        enableOrDisable(newConfig);
      } else if (newConfig.enable === true) {
        updateIfChanged(newConfig);
      }
      localConfig = newConfig;
    });
  }

})();
