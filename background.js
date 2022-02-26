var dic_url = "https://dict-co.iciba.com/api/dictionary.php?key=9A801B3C3A8D0AB5A5059C2F4B71AC50&w=";
var bank_url = "https://www.context-dictionary.com/add/?word=" ;

let DICMode_Google  =  true;

const GOOGLE_SPEECH_URI = 'https://www.google.com/speech-api/v1/synthesize',

    DEFAULT_HISTORY_SETTING = {
        enabled: true
    };

function extractMeaning (document, context) {
    if (!document.querySelector("[data-dobid='hdw']")) { return null; }
    
    var word = document.querySelector("[data-dobid='hdw']").textContent,
        definitionDiv = document.querySelector("div[data-dobid='dfn']"),
        meaning = "";

    if (definitionDiv) {
        definitionDiv.querySelectorAll("span").forEach(function(span){
            if(!span.querySelector("sup"))
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

//    fetch(bank_url + request.selection + "&pageurl=" + request.theURL +
 //       "&context=" + request.theContext);

    if(!DICMode_Google){
        //Chinese dictioanry
        fetch(dic_url + request.selection.toLowerCase()).
                then(response => response.text())
                .then(data => sendResponse(data));

    // return true from the event listener to indicate you wish to send a response asynchronously
    // (this will keep the message channel open to the other end until sendResponse is called).
    //
    return true;


    }else{


   const { word, lang } = request, 
        url = `https://www.google.com/search?hl=${lang}&q=define+${word}&gl=US`;
    
    fetch(url, { 
            method: 'GET',
            credentials: 'omit'
        })
        .then((response) => response.text())
        .then((text) => {
            const document = new DOMParser().parseFromString(text, 'text/html'),
                content = extractMeaning(document, { word, lang });

            sendResponse({ content });

        })

    return true;

    }
});
