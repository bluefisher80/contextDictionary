// Import the browser polyfill
//self.importScripts('common/browser-polyfill.js');


const browserAPI = window.browser || window.chrome;

console.log("This is some logs" + browserAPI);

var dic_url = "https://dict-co.iciba.com/api/dictionary.php?key=9A801B3C3A8D0AB5A5059C2F4B71AC50&w=";

let DICMode_Google = true;

const GOOGLE_SPEECH_URI = 'https://www.google.com/speech-api/v1/synthesize',

    DEFAULT_HISTORY_SETTING = {
        enabled: true
    };

function extractMeaning(document, context) {
    if (!document.querySelector("[data-dobid='hdw']")) { return null; }

    var word = document.querySelector("[data-dobid='hdw']").textContent,
        definitionDiv = document.querySelector("div[data-dobid='dfn']"),
        meaning = "";

    if (definitionDiv) {
        definitionDiv.querySelectorAll("span").forEach(function (span) {
            if (!span.querySelector("sup"))
                meaning = meaning + span.textContent;
        });
    }

    meaning = meaning[0].toUpperCase() + meaning.substring(1);

    var audio = document.querySelector("audio[jsname='QInZvb']"),
        source = document.querySelector("audio[jsname='QInZvb'] source"),
        audioSrc = source && source.getAttribute('src');

    if (audioSrc) {
        !audioSrc.includes("http") && (audioSrc = audioSrc.replace("//", "https://"));
    }
    else if (audio) {
        let exactWord = word.replace(/·/g, ''), // We do not want syllable seperator to be present.

            queryString = new URLSearchParams({
                text: exactWord,
                enc: 'mpeg',
                lang: context.lang,
                speed: '0.4',
                client: 'lr-language-tts',
                use_google_only_voices: 1
            }).toString();

        audioSrc = `${GOOGLE_SPEECH_URI}?${queryString}`;
    }

    return { word: word, meaning: meaning, audioSrc: audioSrc };
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

    // Get existing words array from storage and add new word
    browserAPI.storage.local.get('savedWords').then(result => {
        const savedWords = result.savedWords || [];
        console.log('Saved words:', savedWords);
        savedWords.push(wordData);
        return browserAPI.storage.local.set({ savedWords });
    });
    
    if (request.lang == 'cn') {
        //Chinese dictioanry
        fetch(dic_url + request.word.toLowerCase()).
            then(response => response.text())
            .then((text) => {
                const document = new DOMParser().parseFromString(text, 'application/xml'),
                    content = extractMeaningIciba(document, {});
                sendResponse({ content });

            });

        // return true from the event listener to indicate you wish to send a response asynchronously
        // (this will keep the message channel open to the other end until sendResponse is called).
        //
        return true;
    } else {
        const { word, lang } = request,
            url = `https://www.google.com/search?hl=${lang}&q=define+${word}&gl=US`;
        //TODO doesn't understand how does the string interpolation work here
        fetch(url, {
            method: 'GET',
            credentials: 'omit'
        })
            .then((response) => response.text())
            .then((text) => {
                const document = new DOMParser().parseFromString(text, 'text/html'),
                    content = extractMeaning(document, { word, lang });

                sendResponse({ content });

            });

        return true;

    }
});



function escapeHTML(str) { return str; }

function extractMeaningIciba(xml, context) {
    let key = "";
    var shop = "null";
    let audioSrc = "";
    let meaning = "";
    WrHtml = "";//clear it
    var hhitshop = xml.getElementsByTagName("dict");
    for (var i = 0; i < hhitshop.length; i++) {
        shop = hhitshop[i];

        key = shop.getElementsByTagName("key")[0].firstChild.nodeValue;
        key = escapeHTML(key);

        if (shop.getElementsByTagName("ps").length > 0 || shop.getElementsByTagName("pos").length > 0) {
            // WrHtml += "<div id=key><strong>" + key + "</strong></div>";
        } else {
            //WrHtml += "<div id=key><strong>Sorry, no definition found for the word.</strong></div>";
        }


        for (var c = 0; c < shop.getElementsByTagName("ps").length; c++) {
            if (shop.getElementsByTagName("ps")[c].firstChild) {
                WrHtml += '<div class=ps><strong>[' + escapeHTML(shop.getElementsByTagName("ps")[c].firstChild.nodeValue) + ']</strong></div>';
                WrHtml += '<audio controls><source src=' + escapeHTML(shop.getElementsByTagName("pron")[c].firstChild.nodeValue) + '></audio>';
                //TODO two audio here , but takes only one now
                audioSrc = shop.getElementsByTagName("pron")[c].firstChild.nodeValue;

            }
        }



        for (var e = 0; e < shop.getElementsByTagName("pos").length; e++) {
            if (shop.getElementsByTagName("pos")[e].firstChild) {
                meaning += shop.getElementsByTagName("pos")[e].firstChild.nodeValue;
            }
            meaning += shop.getElementsByTagName("acceptation")[e].firstChild.nodeValue;
        }
    }

    return { word: key, meaning: meaning, audioSrc: audioSrc };
}

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

browserAPI.browserAction.onClicked.addListener(() => {
    browserAPI.tabs.create({
        url: browserAPI.runtime.getURL("wordList.html")
    });
});
