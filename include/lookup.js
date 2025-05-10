var DEFAULT_LANGUAGE = "zh-CN", DEFAULT_TRIGGER_KEY = "none", LANGUAGE, TRIGGER_KEY;

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

//Copilot tell me browser is default in firefox but not window.browser
//polyfill is for chrome to use browser.
//so if no polyfill, browserAPI how to make it cross-browser


var longPressTimer, isLoading, isLongPressing, mouseDown,
    initEvent, startOffset, rangeParentNode, theSelection,
    theURL, theContext, targetWord;


var cancelLongPress = function () {
    clearTimeout(longPressTimer);
    longPressTimer = null;
}


var onKikinGesture = function (event) {
    return;
    //    console.log("bypassing the customDispatchEvent " + event.detail.status + " " + event.detail.reason );
};

window.addEventListener("mychromeGesture", onKikinGesture, true);

var customDispatchEvent = function (s, r) {
    window.dispatchEvent(new CustomEvent("mychromeGesture", {
        //TODO
        detail: {
            status: s,
            reason: r,
            target: initEvent.target
        }
    }));
}

const DefaultDelay = 700;
var onMouseUp = function (e) {
    mouseDown = false;

    // Clear any existing timer
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }

    // Get selected text using window.getSelection
    const selection = window.getSelection().toString();

    // If there's a selection, use it; otherwise, use caret position logic
    if (selection) {
        targetWord = selection;
        // Check if word contains only whitespace or is empty
        if (!targetWord || !targetWord.trim()) {
            return;
        }
        theURL = window.document.URL;
        theContext = selection.length > 50 ? selection : window.getSelection().anchorNode.textContent;
        console.log("Selected text:", targetWord);
        initEvent = e; // Store the event for later use in showMeaning
        // launch a timer to detect "long press"
        longPressTimer = setTimeout(prepareToShow, DefaultDelay);
        return; // Exit early since we have the selection
    }

    // Clear any existing timer
    if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
    }

    startOffset = 0;
    rangeParentNode = null;
    console.log("onMouseUp registered handler is called");
};

var onMouseMove = function (e) {
    if (longPressTimer) {
        isLongPressing = false;
        cancelLongPress();
        customDispatchEvent("failed", "move");
    }
}

var onScroll = function (e) {
    if (longPressTimer) {
        isLongPressing = false;
        cancelLongPress();
        customDispatchEvent("failed", "scroll");
    }
}

/**
 * Function name is not correct, now is a switch to show the meaning.
 * In Caret mode, it will be called when long press is detected.
 * In Window.getSelection mode, it will be called when the user select a word.
 * @param {*} e 
 */
var prepareToShow = function (e) {
    console.log("Enter Long Pressing Detecting Mode");
    // update status
    isLongPressing = true;
    longPressTimer = null;
    popup_opened = true;// This is a flag to indicate that the popup would be opened.
    showMeaning(initEvent);
};


var startLoading = function (clbk) {
    // only load the thing once
    if (isLoading) { return; }
    isLoading = true;
    console.log("loading here");
}


function urlLongClick(e) {

    var isLink = e.target.tagName == "A" ||
        (e.target.parentNode && e.target.parentNode.tagName == "A");

    if (isLink && isLongPressing) {
        e.preventDefault();
    }


}

const URLCaretModeDelay = 1500;
/**
 * Try to detect if the user is in the long pressing state, if so, then select the word
 * and show the meaning.
 * @param {*} e 
 * @returns 
 */
function onMouseDown(e) {
    document.querySelectorAll(".VDXfz").forEach(function (Node) {
        Node.remove();
    });


    console.log("this is inside the mousedown check");
    // check if left click
    if (e.which != 1) { return; }
    // check if it's in an input
    if (/^(INPUT|TEXTAREA|SELECT|HTML)$/.exec(e.target.tagName)) { return; }
    // save infos
    isLongPressing = false;
    mouseDown = true;
    //There is no window object in the this script TODO
    //selection = window.getSelection().toString();
    initEvent = e;

    if (document.caretRangeFromPoint) {
        range = document.caretRangeFromPoint(initEvent.clientX, initEvent.clientY);
        rangeParentNode = range.startContainer;
        startOffset = range.startOffset;
        //TODO startContainer will return whole body node when shadow node clicked.
    }

    if (document.caretPositionFromPoint) {
        console.log("mouse download, carent position for FF");
        startOffset = initEvent.rangeOffset;
        rangeParentNode = initEvent.rangeParent;
    }


    if (document.caretPositionFromPoint) {
        // Standard API supported in modern browsers (including Chrome and Firefox)
        const caretPosition = document.caretPositionFromPoint(initEvent.clientX, initEvent.clientY);
        rangeParentNode = caretPosition.offsetNode;
        startOffset = caretPosition.offset;

        // Ensure the rangeParentNode is a text node
        if (rangeParentNode.nodeType !== Node.TEXT_NODE) {
            console.log("Clicked on a non-text node, skipping logic.");
            return;
        }
    } else if (document.caretRangeFromPoint) {
        // Fallback for older browsers
        const range = document.caretRangeFromPoint(initEvent.clientX, initEvent.clientY);
        rangeParentNode = range.startContainer;
        startOffset = range.startOffset;

        // Ensure the rangeParentNode is a text node
        if (rangeParentNode.nodeType !== Node.TEXT_NODE) {
            console.log("Clicked on a non-text node, skipping logic.");
            return;
        }
    } else {
        console.log("Neither caretPositionFromPoint nor caretRangeFromPoint is supported.");
        return;
    }

    targetWord = findTargetWord(startOffset, rangeParentNode);

    theURL = window.document.URL;
    theContext = rangeParentNode.textContent;
    console.log("Show the original event range offset ", startOffset);
    console.log("Show the window URL:", window.document.URL);
    console.log("Show the original event content ", rangeParentNode.textContent);
    // launch a timer to detect "long press"
    var isLink = e.target.tagName == "A" ||
        (e.target.parentNode && e.target.parentNode.tagName == "A");
    longPressTimer = setTimeout(prepareToShow, isLink ? URLCaretModeDelay : DefaultDelay);
};




function findTargetWord(startOffset, parentNode) {

    console.log("Enter finding target word logic");
    table = [];

    console.log("Enter finding target word logic 1");
    //disalbe this method for just right now
    console.log("Enter finding target word logic 1.1");

    offset = startOffset;
    console.log("Enter finding target word logic 1.2");

    console.log("Enter finding target word logic 2");
    console.log("Enter find target node " + parentNode.textContent);
    var textarray = parentNode.textContent.split("");
    var textlen = parentNode.textContent.length;


    var forward = offset + 1;
    var backword = offset - 1;

    if (! /[a-zA-Z]/.test(textarray[offset])) {
        forward = textlen + 1;
        //the clicked char is not a normal char, so there is no need to continue forward-way.
    } else {
        //A letter belongs to [a-zA-Z]
        table.splice(0, 0, textarray[offset]);
    }

    console.log("Enter finding target word logic 3");
    while (backword >= 0) {
        if (! /[a-zA-Z]/.test(textarray[backword])) { break; }
        else {
            table.splice(0, 0, textarray[backword]);
        }
        backword -= 1;
    }

    console.log("Enter finding target word logic 4");
    while (forward <= textlen) {
        if (! /[a-zA-Z]/.test(textarray[forward])) { break; }
        else {
            table.push(textarray[forward]);
        }
        forward += 1;
    }

    var word = table.join("");
    console.log("Ready to print out the word: ", word);
    return word;

}


//the LongClick handler
window.addEventListener("mouseup", onMouseUp, true);
window.addEventListener("click", urlLongClick, true);
document.addEventListener("click", event_click, true);
window.addEventListener("mousedown", onMouseDown, true);
window.addEventListener("mousemove", onMouseMove, true);
window.addEventListener("scroll", onScroll, true);
//this is a collection of the html elements of the Popup.
let createdDiv;

/**
 * 
 * @param {*} event 
 * @returns 
 */
function showMeaning(event) {

    info = getSelectionInfo(event);

    info.word = targetWord;
    info.theURL = theURL;
    info.theContext = theContext;
    info.originalPageLang = document.documentElement.lang || document.querySelector("html").getAttribute("lang") || "en";
    console.log("Show the page html lang element", info.originalPageLang);

    if (!info){ return; }
    retrieveMeaning(info)

    // Creating this div while we are fetching meaning to make extension more fast.
    createdDiv = createDiv(info);
}


function getSelectionInfo(event) {
    var word;
    var boundingRect;

    boundingRect = getSelectionCoords(event);

    var top = boundingRect.top + window.scrollY,
        bottom = boundingRect.bottom + window.scrollY,
        left = boundingRect.left + window.scrollX;

    if (boundingRect.height == 0) {
        top = event.pageY;
        bottom = event.pageY;
        left = event.pageX;
    }

    return {
        top: top,
        bottom: bottom,
        left: left,
        word: "template",
        clientY: event.clientY,
        height: boundingRect.height
    };
}

function retrieveMeaning(info) {

    return browserAPI.runtime.sendMessage({
        word: info.word,
        theURL: info.theURL,
        theContext: info.theContext,
        lang: LANGUAGE,
        time: Date.now()
    });
}

/**
 * Returned an object collection of the popup div elements.
 * @param {*} info 
 * @returns 
 */
function createDiv(info) {
    var hostDiv = document.createElement("div");

    hostDiv.className = "dictionaryDiv";
    hostDiv.style.left = info.left - 10 + "px";
    hostDiv.style.position = "absolute";
    hostDiv.style.zIndex = "1000000"
    hostDiv.attachShadow({ mode: "open" });

    var shadow = hostDiv.shadowRoot;
    var style = document.createElement("style");
    //style.textContent = "*{ all: initial}";
    style.textContent = ".mwe-popups{background:#fff;position:absolute;z-index:110;-webkit-box-shadow:0 30px 90px -20px rgba(0,0,0,0.3),0 0 1px #a2a9b1;box-shadow:0 30px 90px -20px rgba(0,0,0,0.3),0 0 1px #a2a9b1;padding:0;font-size:14px;min-width:300px;border-radius:2px}.mwe-popups.mwe-popups-is-not-tall{width:320px}.mwe-popups .mwe-popups-container{color:#222;margin-top:-9px;padding-top:9px;text-decoration:none}.mwe-popups.mwe-popups-is-not-tall .mwe-popups-extract{min-height:40px;max-height:140px;overflow:hidden;margin-bottom:47px;padding-bottom:0}.mwe-popups .mwe-popups-extract{margin:16px;display:block;color:#222;text-decoration:none;position:relative} .mwe-popups.flipped_y:before{content:'';position:absolute;border:8px solid transparent;border-bottom:0;border-top: 8px solid #a2a9b1;bottom:-8px;left:10px}.mwe-popups.flipped_y:after{content:'';position:absolute;border:11px solid transparent;border-bottom:0;border-top:11px solid #fff;bottom:-7px;left:7px} .mwe-popups.mwe-popups-no-image-tri:before{content:'';position:absolute;border:8px solid transparent;border-top:0;border-bottom: 8px solid #a2a9b1;top:-8px;left:10px}.mwe-popups.mwe-popups-no-image-tri:after{content:'';position:absolute;border:11px solid transparent;border-top:0;border-bottom:11px solid #fff;top:-7px;left:7px} .audio{background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAcUlEQVQ4y2P4//8/AyUYQhAH3gNxA7IAIQPmo/H3g/QA8XkgFiBkwHyoYnRQABVfj88AmGZcTuuHyjlgMwBZM7IE3NlQGhQe65EN+I8Dw8MLGgYoFpFqADK/YUAMwOsFigORatFIlYRElaRMWmaiBAMAp0n+3U0kqkAAAAAASUVORK5CYII=);background-position: center;background-repeat: no-repeat;cursor:pointer;margin-left: 8px;opacity: 0.5; width: 16px; display: inline-block;} .audio:hover {opacity: 1;}";
    shadow.appendChild(style);

    var encapsulateDiv = document.createElement("div");
    encapsulateDiv.style = "all: initial; text-shadow: transparent 0px 0px 0px, rgba(0,0,0,1) 0px 0px 0px !important;";
    shadow.appendChild(encapsulateDiv);


    var popupDiv = document.createElement("div");
    popupDiv.style = "font-family: arial,sans-serif; border-radius: 12px; border: 1px solid #a2a9b1; box-shadow: 0 0 17px rgba(0,0,0,0.5)";
    encapsulateDiv.appendChild(popupDiv);


    var contentContainer = document.createElement("div");
    contentContainer.className = "mwe-popups-container";
    popupDiv.appendChild(contentContainer);



    var content = document.createElement("div");
    content.className = "mwe-popups-extract";
    content.style = "line-height: 1.4; margin-top: 0px; margin-bottom: 11px; max-height: none";
    contentContainer.appendChild(content);


    var heading = document.createElement("h3");
    heading.style = "margin-block-end: 0px; display:inline-block;";
    heading.textContent = "Searching";

    var meaning = document.createElement("p");
    meaning.style = "margin-top: 10px";
    meaning.textContent = "Please Wait...";

    var audio = document.createElement("div");
    audio.className = "audio";
    audio.innerHTML = "&nbsp;";
    audio.style.display = "none";

    var moreInfo = document.createElement("a");
    moreInfo.href = `https://www.google.com/search?hl=${LANGUAGE}&q=define+${info.word}`;
    moreInfo.style = "float: right; text-decoration: none;";
    moreInfo.target = "_blank";


    var reviewLink = document.createElement("a");
    reviewLink.addEventListener("click", function (e) {
        e.preventDefault();
        browserAPI.runtime.sendMessage({
            action: "openWordList"
        });
    });
    reviewLink.style = "float: left; text-decoration:none;";
    reviewLink.target = "_blank";
    reviewLink.textContent = "« Review";

    content.appendChild(heading);
    content.appendChild(audio);
    content.appendChild(meaning);
    content.appendChild(reviewLink);
    content.appendChild(moreInfo);
    document.body.appendChild(hostDiv);

    if (info.clientY < window.innerHeight / 2) {
        popupDiv.className = "mwe-popups mwe-popups-no-image-tri mwe-popups-is-not-tall";
        hostDiv.style.top = info.bottom + 10 + "px";
        if (info.height == 0) {
            hostDiv.style.top = parseInt(hostDiv.style.top) + 8 + "px";
        }
    } else {
        popupDiv.className = "mwe-popups flipped_y mwe-popups-is-not-tall";
        hostDiv.style.top = info.top - 10 - popupDiv.clientHeight + "px";

        if (info.height == 0) {
            hostDiv.style.top = parseInt(hostDiv.style.top) - 8 + "px";
        }
    }

    return {
        heading,
        meaning,
        moreInfo,
        audio
    };

}

function getSelectionCoords(event) {

    let rangeForCoord;

    let oRect;

    if (document.caretRangeFromPoint) {
        rangeForCoord = document.caretRangeFromPoint(event.clientX, event.clientY);
        oRect = rangeForCoord.getBoundingClientRect();
    }

    if (document.caretPositionFromPoint) {
        rangeForCoord = document.caretPositionFromPoint(event.clientX, event.clientY);
        oRect = rangeForCoord.getClientRect();
    }

    return oRect;
}


/**
 * Update the content of the popup div with the new meaning.
 * @param {*} createdDiv 
 * @param {*} content 
 */
function appendToDiv(createdDiv, content) {
    console.log("First show log in the appendToDiv" + content);
    var hostDiv = createdDiv.heading.getRootNode().host;
    console.log("Second show log in the appendToDiv" + content);
    var popupDiv = createdDiv.heading.getRootNode().querySelectorAll("div")[1];

    var heightBefore = popupDiv.clientHeight;
    createdDiv.heading.textContent = content.word;
    createdDiv.meaning.textContent = content.meaning;
    console.log("show log in the appendToDiv" + content);
    createdDiv.moreInfo.textContent = "More »";

    var heightAfter = popupDiv.clientHeight;
    var difference = heightAfter - heightBefore;


    if (popupDiv.classList.contains("flipped_y")) {
        hostDiv.style.top = parseInt(hostDiv.style.top) - difference + 1 + "px";
    }

    if (content.audioSrc) {
        var sound = document.createElement("audio");
        sound.src = content.audioSrc;
        createdDiv.audio.style.display = "inline-block";
        createdDiv.audio.addEventListener("click", function () {
            sound.play();
        });
    }
}

/**
 * Change the heading and meaning text when no meaning is found.
 * @param {*} createdDiv 
 */
function noMeaningFound(createdDiv) {
    createdDiv.heading.textContent = "Sorry";
    createdDiv.meaning.textContent = "No definition found.";
}

/**
 * Remove all popups when the user clicks outside of the popup.
 * @param {*} event 
 */
function removeMeaning(event) {
    var element = event.target;
    if (!element.classList.contains("dictionaryDiv")) {
        document.querySelectorAll(".dictionaryDiv").forEach(function (Node) {
            Node.remove();
        });

        popup_opened = false;
    }
}

function is_chinese(word) {
    return (/^[\u4e00-\u9fa5]+$/g).test(word);
}
function is_english(word) {
    return (/^[a-z\sA-Z]+$/g).test(word);
}

function valid_word(word) {
    if (word.length === 0 || word.length > 190) {
        return false;
    }
    if (is_chinese(word)) {
        return "Chinese";
    }
    if (is_english(word)) {
        return "English";
    }
    return "Mixed";
}

var popup_opened = false;

console.log("How many bodies in the page loading");

// deal with Clearly
/*
document.addEventListener("DOMNodeInserted", function(event) {
    var element = event.target;
    if ($(element).attr("id") == "readable_iframe") {
        // HACK: wait for iframe ready
        setTimeout(function() {
            console.log("Register event hander handle_longpressing and event_click for only iframe readable_iframe case");
            $("body", element.contentDocument).click(event_click);
            if ($(element).css('z-index') >= 2147483647) {
                var style = $(element).attr('style') + ' z-index: 2147483646 !important';
                $(element).attr('style', style);
            }
        }, 1000);
    }
});
*/


/**
 * This would remove the meaning popup when it's in opened state and is not long
 * pressing.
 * 
 * @param {*} event 
 */
function event_click(event) {
    console.log("this method was triggered in the event_click method");
    if (popup_opened && !isLongPressing) {
        removeMeaning(event);
    }
}



(function () {
    let storageItem = browserAPI.storage.local.get();

    storageItem.then((results) => {
        let interaction = results.interaction || { dblClick: { key: DEFAULT_TRIGGER_KEY } };
        console.log("Print out the window.navigator.language here: ", window.navigator.language);
        LANGUAGE = results.language || (window.navigator.language !== 'en-US' ? window.navigator.language : DEFAULT_LANGUAGE);
        TRIGGER_KEY = interaction.dblClick.key;
    });
})();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message in content script:", message);
    if (message.action === "parseXML") {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(message.text, 'application/xml');
        const content = extractMeaningIciba(xmlDoc, {});
        if (!content || !content.word) {
            return noMeaningFound(createdDiv); // Use the global createdDiv
        }
        console.log("Parsed content in listener method:", content);
        appendToDiv(createdDiv, content); // Use the global createdDiv
    } else if (message.action === "parseHTML") {
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(message.text, 'text/html');
        const content = extractMeaning(htmlDoc, { word: message.word, lang: message.lang });
        if (!content || !content.word) {
            return noMeaningFound(createdDiv); // Use the global createdDiv
        }
        appendToDiv(createdDiv, content); // Use the global createdDiv
    } else if (message.action === "displayError") {
        console.error(message.error);
        const createdDiv = createDiv({ word: "Error" });
        noMeaningFound(createdDiv);
    } else if (message.action === "parseJSON") {
        // Handle JSON parsing if needed
        console.log("Received JSON parsing request", message);
        const content = extractMeaningJSON(message.data);
        if (!content || !content.word) {
            return noMeaningFound(createdDiv); // Use the global createdDiv
        }
        appendToDiv(createdDiv, content); // Use the global createdDiv    
    } else if (message.action === "parseJSON5") {
        // Handle JSON parsing if needed
        console.log("Received JSON from google client5  parsing request", message);
        const content = extractMeaningJSON5(message.data);
        if (!content || !content.word) {
            
            return noMeaningFound(createdDiv); 
        }
        appendToDiv(createdDiv, content);  
    }
}
);

/**
 * This one is for google tranlate API v2
 * @param {*} jsonData 
 * @returns 
 */
function extractMeaningJSON(jsonData) {
    console.log("Extracting meaning from JSON data:", jsonData);

    if (!jsonData || !jsonData.data || !jsonData.data.translations || jsonData.data.translations.length === 0) {
        console.log("Invalid or empty JSON data");
        return null;
    }

    const translatedText = jsonData.data.translations[0].translatedText;
    console.log("Translated text:", translatedText);

    const word = "Translation"; // Or get the original word from somewhere if available
    const meaning = translatedText;
    const audioSrc = null; // No audio available

    console.log("Returning result:", { word, meaning, audioSrc });
    return { word: word, meaning: meaning, audioSrc: audioSrc };
}


/**
 * Parse the JSON data received from the Google client5 and extract the meaning.
 * @param {*} jsonData 
 * @returns 
 */
function extractMeaningJSON5(jsonData) {
    console.log("Extracting meaning from JSON data:", jsonData);

    let meaning = "";

    if (jsonData && jsonData.dict && jsonData.dict.length > 0) {
        jsonData.dict.forEach(dictEntry => {
            if (dictEntry.pos) {
                meaning += `${dictEntry.pos}: `;
            }
            if (dictEntry.terms) {
                meaning += dictEntry.terms.join(', ');
            }
            meaning += ";"; // Add a line break between dictionary entries
        });
        // Remove the last <br> from the meaning string
        meaning = meaning.replace(/<br>$/, '');
    } else if (jsonData && jsonData.sentences && jsonData.sentences[0] && jsonData.sentences[0].trans) {
        // Use sentences[0].trans as meaning if jsonData.dict is missing(some language pairs does not return dict element)
        meaning = jsonData.sentences[0].trans;
        if(jsonData.sentences[0].trans === jsonData.sentences[0].orig){
            //There is no translation, maybe the user just seleted contents at random, and the engine did not find any 
            //translation.
            return null;
        }
    } else {
        console.log("Invalid or empty JSON data");
        return null;
    }

    const word = "Translation"; // Or get the original word from somewhere if available
    const audioSrc = null; // No audio available

    console.log("Returning result:", { word, meaning, audioSrc });
    return { word: word, meaning: meaning, audioSrc: audioSrc };
}

// Reuse the existing extractMeaningIciba function
function extractMeaningIciba(xml, context) {
    let key = "";
    let audioSrc = "";
    let meaning = "";
    const hhitshop = xml.getElementsByTagName("dict");

    for (let i = 0; i < hhitshop.length; i++) {
        const shop = hhitshop[i];
        key = shop.getElementsByTagName("key")[0].firstChild.nodeValue;

        for (let c = 0; c < shop.getElementsByTagName("ps").length; c++) {
            if (shop.getElementsByTagName("ps")[c].firstChild) {
                audioSrc = shop.getElementsByTagName("pron")[c].firstChild.nodeValue.replace('http://', 'https://');
                
            }
        }

        for (let e = 0; e < shop.getElementsByTagName("pos").length; e++) {
            if (shop.getElementsByTagName("pos")[e].firstChild) {
                meaning += shop.getElementsByTagName("pos")[e].firstChild.nodeValue;
            }
            meaning += shop.getElementsByTagName("acceptation")[e].firstChild.nodeValue;
        }
    }

    return { word: key, meaning, audioSrc };
}

// Reuse the existing extractMeaning function,used for google search engine , abondoned?
function extractMeaning(document, context) {
    if (!document.querySelector("[data-dobid='hdw']")) return null;

    const word = document.querySelector("[data-dobid='hdw']").textContent;
    const definitionDiv = document.querySelector("div[data-dobid='dfn']");
    let meaning = "";

    if (definitionDiv) {
        definitionDiv.querySelectorAll("span").forEach((span) => {
            if (!span.querySelector("sup")) meaning += span.textContent;
        });
    }

    meaning = meaning[0].toUpperCase() + meaning.substring(1);

    const audio = document.querySelector("audio[jsname='QInZvb']");
    const source = document.querySelector("audio[jsname='QInZvb'] source");
    let audioSrc = source && source.getAttribute('src');

    if (audioSrc) {
        if (!audioSrc.includes("http")) {
            audioSrc = audioSrc.replace("//", "https://");
        }
    } else if (audio) {
        const exactWord = word.replace(/·/g, '');
        const queryString = new URLSearchParams({
            text: exactWord,
            enc: 'mpeg',
            lang: context.lang,
            speed: '0.4',
            client: 'lr-language-tts',
            use_google_only_voices: 1
        }).toString();

        audioSrc = `${GOOGLE_SPEECH_URI}?${queryString}`;
    }

    return { word, meaning, audioSrc };
}
