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

    // Get existing words array from storage and add new word.
    // only handle for caret mode, since 'selection' mode could trigger fake selection a lot.
    if (request.triggerMode == 'caret') {
        browserAPI.storage.local.get('savedWords').then(result => {
            const savedWords = result.savedWords || [];
            console.log('Saved words:', savedWords);
            savedWords.push(wordData);
            return browserAPI.storage.local.set({ savedWords });
        });
    }
    

    if (request.lang == 'zh-CN' && /^[a-zA-Z]+$/.test(request.word) && request.originalPageLang == 'en') {
        //Only English to Chinese Single word dictioanry when original page is English to exclude German , which 
        //is not supported by iciba but supported by Google, German share same alphabet with English
        fetch(dic_url + request.word.toLowerCase()).
            then(response => response.text())
            .then((text) => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "parseXML", text }, (response) => {
                        sendResponse(response);
                    });
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
        word = request.word;
        lang = request.lang;

        // Free Google Translate API
        let urlFree = `https://clients5.google.com/translate_a/single?dj=1&dt=t&dt=sp&dt=ld&dt=bd&client=dict-chrome-ex&sl=auto&tl=${lang}&q=${word}`;

        fetch(urlFree)
            .then((response) => response.json())
            .then((data) => {
                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "parseJSON5", data }, (response) => {
                        sendResponse(response);
                    });
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