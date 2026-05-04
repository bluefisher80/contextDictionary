const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
console.log("From background service-worker , without polyfill browserAPI is " , browserAPI);

console.log("This is some logs" + browserAPI);

var dic_url = "https://dict-co.iciba.com/api/dictionary.php?key=9A801B3C3A8D0AB5A5059C2F4B71AC50&w=";

const GOOGLE_SPEECH_URI = 'https://www.google.com/speech-api/v1/synthesize',

DEFAULT_HISTORY_SETTING = {
        enabled: true
    };

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    if (request.action === "openWordList") {
        chrome.tabs.create({
            url: chrome.runtime.getURL("wordList.html")
        });
        return
    }

    // Store the word data in browser storage
    const wordData = {
        word: request.word,
        pageUrl: request.theURL,
        context: request.theContext,
        timestamp: new Date().toISOString()
    };

// Determine effective language (default to zh-CN if not set)
    const effectiveLang = (request.lang && request.lang.trim()) ? request.lang.trim() : 'zh-CN';
    
    // Skip if page language matches target language (same-language lookup has no learning value)
    const pageLangPrefix = request.originalPageLang ? request.originalPageLang.split('-')[0] : '';
    const targetLangPrefix = effectiveLang.split('-')[0];
    if (pageLangPrefix === targetLangPrefix) {
        // Check if we should show language configuration reminder
        if (request.triggerMode === 'selection' && !(request.lang && request.lang.trim())) {
            // Double-click without language config - check reminder flag
            browserAPI.storage.local.get('langReminderShown').then(result => {
                if (!result.langReminderShown) {
                    // Show reminder in popup
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        chrome.tabs.sendMessage(tabs[0].id, { 
                            action: "showLangReminder",
                            pageLang: request.originalPageLang 
                        });
                    });
                    // Set flag so reminder only shows once
                    browserAPI.storage.local.set({ langReminderShown: true });
                }
            });
        }
        return; // Silent skip - same language, no vocabulary benefit
    }
    
    // Decide whether to save based on trigger mode
    // Long-Press (caret) = intentional, always save (with language fallback)
    // Double-click (selection) = only save if user explicitly set a language
    let shouldSave = false;
    if (request.triggerMode === 'caret') {
        shouldSave = true; // Long-Press always saves
    } else if (request.triggerMode === 'selection') {
        shouldSave = !!(request.lang && request.lang.trim()); // Double-click only if language explicitly set
    }
    
    if (shouldSave) {
        browserAPI.storage.local.get('savedWords').then(result => {
            const savedWords = result.savedWords || [];
            console.log('Saved words:', savedWords);
            savedWords.push(wordData);
            browserAPI.storage.local.set({ savedWords });
        });
    }
    

    if (effectiveLang == 'zh-CN' && /^[a-zA-Z]+$/.test(request.word) && (request.originalPageLang.startsWith('en'))) {
        //Only English to Chinese Single word dictioanry when original page is English to exclude German , which 
        //is not supported by iciba but supported by Google, German share same alphabet with English
        fetch(dic_url + request.word.toLowerCase()).
            then(response => response.text())
            .then((text) => {
                // Extract meaning from XML and save it
                const meaning = extractIcibaMeaning(text);
                saveWordMeaning(request.word, meaning);
                
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "parseXML", text });
                });

            })
            .catch((error) => {
                console.error("Error fetching dictionary data:", error);
                sendResponse({ error: "Failed to fetch dictionary data" });
            });
        // return true from the event listener to indicate you wish to send a response asynchronously
        // (this will keep the message channel open to the other end until sendResponse is called).
        //TODO does it need to return true here since code is now SendMessage? is it async?
        return true;
    } else {
        const word = encodeURIComponent(request.word);
        lang = effectiveLang;

        console.log("word is " + word);

        // Free Google Translate API
        let urlFree = `https://clients5.google.com/translate_a/single?dj=1&dt=t&dt=sp&dt=ld&dt=bd&client=dict-chrome-ex&sl=auto&tl=${lang}&q=${word}`;

        fetch(urlFree)
            .then((response) => response.json())
            .then((data) => {
                // Extract meaning from Google Translate and save it
                const meaning = extractGoogleMeaning(data);
                saveWordMeaning(request.word, meaning);
                
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "parseJSON5", data });
                });
            })
            .catch((error) => {
                console.error("Error fetching free translation data:", error);
                sendResponse({ error: "Failed to fetch free translation data" });
            });

        return true;

        /**  Official Google Translate API (requires key)
         *  APIs & Services > Credentials > Create credentials > API key
const gTranslateURL = 'https://translation.googleapis.com/language/translate/v2?key=Key see above line';
const headers = {
    'Content-Type': 'application/json; charset=utf-8',
};

fetch(gTranslateURL, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
        "q": [`${word}`],
        "target": `${lang}`,
}),
})
.then((response) => response.json())
.then((data) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: "parseJSON", data }, (response) => {
            sendResponse(response); 
        });
    });

})
.catch((error) => console.error(error));
return true;*/

    }
});


function extractIcibaMeaning(xmlText) {
    try {
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "application/xml");
        const dicts = xml.getElementsByTagName("dict");
        if (dicts.length === 0) return null;
        
        let meanings = [];
        const dict = dicts[0];
        
        // Extract phonetic
        const psElements = dict.getElementsByTagName("ps");
        if (psElements.length > 0 && psElements[0].firstChild) {
            meanings.push(`[${psElements[0].firstChild.nodeValue}]`);
        }
        
        // Extract definitions by pos (part of speech)
        const posElements = dict.getElementsByTagName("pos");
        const acceptationElements = dict.getElementsByTagName("acceptation");
        for (let i = 0; i < posElements.length; i++) {
            let def = "";
            if (posElements[i].firstChild) {
                def += posElements[i].firstChild.nodeValue + " ";
            }
            if (acceptationElements[i] && acceptationElements[i].firstChild) {
                def += acceptationElements[i].firstChild.nodeValue;
            }
            if (def.trim()) meanings.push(def.trim());
        }
        
        return meanings.join("; ");
    } catch (e) {
        console.error("Error extracting iciba meaning:", e);
        return null;
    }
}

function extractGoogleMeaning(jsonData) {
    try {
        let meaning = "";
        if (jsonData && jsonData.dict && jsonData.dict.length > 0) {
            jsonData.dict.forEach(dictEntry => {
                let entry = "";
                if (dictEntry.pos) {
                    entry += dictEntry.pos + ": ";
                }
                if (dictEntry.terms) {
                    entry += dictEntry.terms.join(", ");
                }
                if (entry) meaning += entry + "; ";
            });
            meaning = meaning.replace(/; $/, "");
        } else if (jsonData && jsonData.sentences && jsonData.sentences[0] && jsonData.sentences[0].trans) {
            meaning = jsonData.sentences[0].trans;
        }
        return meaning || null;
    } catch (e) {
        console.error("Error extracting google meaning:", e);
        return null;
    }
}

function saveWordMeaning(word, meaning) {
    if (!meaning) return;
    browserAPI.storage.local.get('savedWords').then(result => {
        const savedWords = result.savedWords || [];
        // Find the most recently saved word matching this word
        for (let i = savedWords.length - 1; i >= 0; i--) {
            if (savedWords[i].word === word && !savedWords[i].meaning) {
                savedWords[i].meaning = meaning;
                browserAPI.storage.local.set({ savedWords });
                break;
            }
        }
    });
}

function escapeHTML(str) { return str; }

function aborted__parseDicData(data) {
    var parser = new DOMParser();
    var xml = parser.parseFromString(data, "application/xml");
    var shop = "null";
    WrHtml = "";//clear it
    var hhitshop = xml.getElementsByTagName("dict");
    for (var i = 0; i < hhitshop.length; i++) {
        shop = hhitshop[i];

        var key = shop.getElementsByTagName("key")[0].firstChild.nodeValue;
        key = escapeHTML(key);

        if (shop.getElementsByTagName("ps").length > 0 || shop.getElementsByTagName("pos").length > 0) {
            // WrHtml += "<div id=key><strong>" + key + "</strong></div>";
        } else {
            //WrHtml += "<div id=key><strong>Sorry, no definition found for the word.</strong></div>";
        }


        WrHtml += '<div class="phonetic">';

        for (var c = 0; c < shop.getElementsByTagName("ps").length; c++) {
            if (shop.getElementsByTagName("ps")[c].firstChild) {
                WrHtml += '<div class=ps><strong>[' + escapeHTML(shop.getElementsByTagName("ps")[c].firstChild.nodeValue) + ']</strong></div>';
                WrHtml += '<audio controls><source src=' + escapeHTML(shop.getElementsByTagName("pron")[c].firstChild.nodeValue) + '></audio>';

            }
        }

        WrHtml += '</div>';

        for (var e = 0; e < shop.getElementsByTagName("pos").length; e++) {
            WrHtml += "<p>";
            if (shop.getElementsByTagName("pos")[e].firstChild) {
                WrHtml += "<strong>" + escapeHTML(shop.getElementsByTagName("pos")[e].firstChild.nodeValue) + "</strong>";
                WrHtml += "&nbsp;&nbsp;&nbsp;";
            }
            WrHtml += escapeHTML(shop.getElementsByTagName("acceptation")[e].firstChild.nodeValue);
            WrHtml += "</p>";
        }
    }

    return WrHtml;
}

browserAPI.action.onClicked.addListener(() => {
    browserAPI.tabs.create({ url: chrome.runtime.getURL("wordList.html") });
});