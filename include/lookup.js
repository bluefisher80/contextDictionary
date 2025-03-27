var DEFAULT_LANGUAGE = "cn" , DEFAULT_TRIGGER_KEY = "none" , LANGUAGE , TRIGGER_KEY;



var longPressTimer, isLoading, isLongPressing, mouseDown,
        initEvent, startOffset, rangeParentNode, theSelection,
         theURL,theContext, targetWord;


var cancelLongPress = function() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
}


var onKikinGesture = function(event){
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


var onMouseUp = function (e) {
    if (longPressTimer) {
        isLongPressing = false;
        cancelLongPress();
        customDispatchEvent("failed", "short");
    }
    mouseDown = false;
    //initEvent = null;

    startOffset = 0;
    rangeParentNode = null;
    console.log("onMouseUp registered handler is called");
};

var onMouseMove = function(e) {
    if (longPressTimer) {
        isLongPressing = false;
        cancelLongPress();
        customDispatchEvent("failed", "move");
    }
}

var onScroll = function(e) {
    if (longPressTimer) {
        isLongPressing = false;
        cancelLongPress();
        customDispatchEvent("failed", "scroll");
    }
}

var onLongPressThenShow = function(e) {
    console.log("Enter Long Pressing Detecting Mode");
    // update status
    isLongPressing = true;
    longPressTimer = null;
    haloword_opened = true;
    showMeaning(initEvent);
};


var startLoading = function(clbk) {
    // only load the thing once
    if (isLoading) {return;}
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


function onMouseDown(e) {
    document.querySelectorAll(".VDXfz").forEach(function(Node){
        Node.remove();
   });


    console.log("this is inside the mousedown check");
    // check if left click
    if (e.which != 1) {return;}
    // check if it's in an input
    if (/^(INPUT|TEXTAREA|SELECT|HTML)$/.exec(e.target.tagName)){return;}
    // save infos
    isLongPressing = false;
    mouseDown = true;
    //There is no window object in the this script TODO
    //selection = window.getSelection().toString();
    initEvent= e;

    if(document.caretRangeFromPoint){
        range = document.caretRangeFromPoint(initEvent.clientX, initEvent.clientY);
        rangeParentNode = range.startContainer;
        startOffset = range.startOffset;
        //TODO startContainer will return whole body node when shadow node clicked.
    }

    if(document.caretPositionFromPoint){
        console.log("mouse download, carent position for FF");
        startOffset = initEvent.rangeOffset;
        rangeParentNode = initEvent.rangeParent;
    }

    targetWord = findTargetWord(startOffset, rangeParentNode);

    theURL = window.document.URL;
    theContext = rangeParentNode.textContent;
    console.log("Show the original event range offset ", startOffset);
    console.log("Show the window URL:", window.document.URL);
    console.log("Show the original event content " , rangeParentNode.textContent);
    // launch a timer to detect "long press"
    var isLink = e.target.tagName == "A" ||
        (e.target.parentNode && e.target.parentNode.tagName == "A");
    longPressTimer = setTimeout(onLongPressThenShow, isLink ? 1500: 700);
};


function lookupWord(){
    console.log("window.navigator.language is " , window.navigator.language);
    NO_USE_handle_longpressing(initEvent);
}

function findTargetWord(startOffset, parentNode){

    console.log("Enter finding target word logic");
    table = [];
  
    console.log("Enter finding target word logic 1");
    //disalbe this method for just right now
    console.log("Enter finding target word logic 1.1");

    offset = startOffset;
    console.log("Enter finding target word logic 1.2");
  
    console.log("Enter finding target word logic 2");
    console.log("Enter find target node "+  parentNode.textContent);
    var textarray = parentNode.textContent.split("");
    var textlen = parentNode.textContent.length;


    var forward = offset + 1;
    var backword = offset- 1;

    if(! /[a-zA-Z]/.test(textarray[offset])){
        forward = textlen+1;
        //the clicked char is not a normal char, so there is no need to continue forward-way.
    }else{
        //A letter belongs to [a-zA-Z]
        table.splice(0,0,textarray[offset]);
    }

    console.log("Enter finding target word logic 3");
    while(backword>=0){
        if(! /[a-zA-Z]/.test(textarray[backword])){break;}
        else{
            table.splice(0,0,textarray[backword]);
        }
        backword -=1;
    }

    console.log("Enter finding target word logic 4");
    while(forward <= textlen){
        if(! /[a-zA-Z]/.test(textarray[forward])){break;}
        else{
            table.push(textarray[forward]);
        }
        forward +=1;
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

function showMeaning(event) {
    var createdDiv,
        info = getSelectionInfo(event);

    info.word = targetWord;
    info.theURL = theURL;
    info.theContext = theContext;

    if (!info) { return; }
    retrieveMeaning(info)
        .then((response) => {
            if (!response.content) { return noMeaningFound(createdDiv); }
            appendToDiv(createdDiv, response.content);
        });

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
    return browser.runtime.sendMessage({
        word: info.word,
        theURL: info.theURL,
        theContext: info.theContext,
        lang: LANGUAGE,
        time: Date.now()
    });
}

function createDiv(info) {
    var hostDiv = document.createElement("div");

    hostDiv.className = "dictionaryDiv";
    hostDiv.style.left = info.left -10 + "px";
    hostDiv.style.position = "absolute";
    hostDiv.style.zIndex = "1000000"
    hostDiv.attachShadow({mode: "open"});

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

    var moreInfo =document.createElement("a");
    moreInfo.href = `https://www.google.com/search?hl=${LANGUAGE}&q=define+${info.word}`;
    moreInfo.style = "float: right; text-decoration: none;";
    moreInfo.target = "_blank";


    var reviewLink = document.createElement("a");
    reviewLink.addEventListener("click", function(e) {
        e.preventDefault();
        browser.runtime.sendMessage({
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

    if(info.clientY < window.innerHeight/2){
        popupDiv.className = "mwe-popups mwe-popups-no-image-tri mwe-popups-is-not-tall";
        hostDiv.style.top = info.bottom + 10 + "px";
        if(info.height == 0){
            hostDiv.style.top = parseInt(hostDiv.style.top) + 8 + "px";
        }
    } else {
        popupDiv.className = "mwe-popups flipped_y mwe-popups-is-not-tall";
        hostDiv.style.top = info.top - 10 - popupDiv.clientHeight + "px";

        if(info.height == 0){
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

   let  rangeForCoord;

   let oRect;

  if(document.caretRangeFromPoint){
    rangeForCoord  = document.caretRangeFromPoint(event.clientX, event.clientY);
    oRect = rangeForCoord.getBoundingClientRect();
  }

  if(document.caretPositionFromPoint){
    rangeForCoord = document.caretPositionFromPoint(event.clientX, event.clientY);
    oRect = rangeForCoord.getClientRect();
    }

    return oRect;
}

function appendToDiv(createdDiv, content){
    var hostDiv = createdDiv.heading.getRootNode().host;
    var popupDiv = createdDiv.heading.getRootNode().querySelectorAll("div")[1];

    var heightBefore = popupDiv.clientHeight;
    createdDiv.heading.textContent = content.word;
    createdDiv.meaning.textContent = content.meaning;
    createdDiv.moreInfo.textContent = "More »";

    var heightAfter = popupDiv.clientHeight;
    var difference = heightAfter - heightBefore;


    if(popupDiv.classList.contains("flipped_y")){
        hostDiv.style.top = parseInt(hostDiv.style.top) - difference + 1 + "px";
    }

    if(content.audioSrc){
      var sound = document.createElement("audio");
      sound.src = content.audioSrc;
      createdDiv.audio.style.display  = "inline-block";
      createdDiv.audio.addEventListener("click", function(){
        sound.play();
      });
    }
}

function noMeaningFound (createdDiv){
  createdDiv.heading.textContent = "Sorry";
  createdDiv.meaning.textContent = "No definition found.";
}

function removeMeaning(event){
    var element = event.target;
    if(!element.classList.contains("dictionaryDiv")){
        document.querySelectorAll(".dictionaryDiv").forEach(function(Node){
            Node.remove();
        });

    haloword_opened = false;
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

var haloword_opened = false;

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


function event_click(event) {
    console.log("this method was triggered in the event_click method");
    if (haloword_opened && !isLongPressing) {
            removeMeaning(event);
    }
}

function NO_USE_handle_longpressing(event) {

    var lang2 = valid_word(theSelection);
    if (!lang2) {
        console.log("word detection");
        return;
    }

    var result;

    browser.runtime.sendMessage({
        selection: theSelection,
        theURL: theURL,
        lang: LANGUAGE,
        theContext: theContext
    },
        (response) => {
            console.log("received user data in promise action, prepare to parse for the data and show it");
            document.getElementById("haloword-content").innerHTML = parseDicData(response);

        });

    // HACK: fix dict window not openable

    setTimeout(function () {
        haloword_opened = true;
    }, 100);

}




(function () {
    let storageItem = browser.storage.local.get();

    storageItem.then((results) => {
        let interaction = results.interaction || { dblClick: { key: DEFAULT_TRIGGER_KEY } };

        LANGUAGE = results.language || DEFAULT_LANGUAGE;
        TRIGGER_KEY = interaction.dblClick.key;
    });
})();
