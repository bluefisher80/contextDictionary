var saveInServerUIControl = false;
chrome.storage.sync.get({
    saveInServer: false 
    }, function(items) {
        saveInServerUIControl = items.saveInServer;
		console.log("SaveInServerUIControl callback value  is " + saveInServerUIControl);
      });


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

var haloword_html = '<div id="haloword-lookup" class="ui-widget-content">\
<div id="haloword-title">\
<span id="haloword-word"></span>\
<div id="haloword-control-container-if">\
 <a href="http://www.context-dictionary.com/list/" id="haloword-pron" class="haloword-button" target="_blank" title="查询历史">history</a>\
</div>\
<div id="haloword-control-container">\
<a herf="#" id="haloword-close" class="haloword-button" title="关闭查询窗"></a>\
</div>\
<br style="clear: both;" />\
</div><div id="haloword-content"></div></div>';

$("body").append(haloword_html);
console.log("How many bodies in the page loading");
// deal with Clearly
document.addEventListener("DOMNodeInserted", function(event) {
    var element = event.target;
    if ($(element).attr("id") == "readable_iframe") {
        // HACK: wait for iframe ready
        setTimeout(function() {
            $("body", element.contentDocument).mouseup(event_mouseup);
            $("body", element.contentDocument).click(event_click);
            if ($(element).css('z-index') >= 2147483647) {
                var style = $(element).attr('style') + ' z-index: 2147483646 !important';
                $(element).attr('style', style);
            }
        }, 1000);
    }
});

$("body").mouseup(event_mouseup);
$("body").click(event_click);

function event_click(event) {
    console.log("when this method triggered");
    if (haloword_opened) {
        var target = $(event.target);
        if (target.attr("id") != "haloword-lookup" && !target.parents("#haloword-lookup")[0]) {
            $("#haloword-lookup").hide();
            haloword_opened = false;
        }
    }
}

//var icon_url = chrome.extension.getURL("img/icon.svg");
var icon_url = chrome.runtime.getURL("img/icon.svg");
var history_icon_url = chrome.runtime.getURL("img/history.png");
var style_content = "<style>\
#haloword-pron { background: url(" + history_icon_url + "); }\
#haloword-close { background: url(" + icon_url + ") -94px 0; }\
#haloword-close:hover { background: url(" + icon_url + ") -111px 0; }</style>";
if ($("head")[0]) {
    $($("head")[0]).append(style_content);
}
else {
    $($("body")[0]).prepend(style_content);
}

//news.google.com
$(".VDXfz").css('z-index',-1);

$("#haloword-lookup").draggable({ handle: "#haloword-title" });

function event_mouseup(e) {
    console.log("final lookup method 2222 ");

        if (!isLongPressing &&  !(e.ctrlKey || e.metaKey) ) {
            console.log("keys detection,but user random click without modify key down case, ignore it.");
            console.log("the Long click word is " + theSelection);
            return;
        }

        var lang2 = valid_word(theSelection);
        if (!lang2) {
            console.log("word detection");
            return;
        }

        var result;
        /*
        chrome.runtime.sendMessage({selection: theSelection,theURL: theURL , theContext: theContext},function(response){
            $("#haloword-content").html(response.result);
        });
        */



        $("#haloword-word").html(theSelection);
        $("#haloword-lookup").attr("style", "left: " + e.pageX + "px;" + "top: " + e.pageY + "px;");
        $("#haloword-close").click(function() {
            $("#haloword-lookup").hide();
            haloword_opened = false;
            return false;
        });

        $("#haloword-content").html("<p>Loading definitions...</p>");
        $("#haloword-content").html(backwork(theSelection,theURL,theContext));
        $("#haloword-lookup").show();
        if (!saveInServerUIControl){
            $("#haloword-control-container-if").hide();
        }
        console.log("mouse up method  in the page script");
        // HACK: fix dict window not openable

        setTimeout(function() {
            haloword_opened = true;
        }, 100);
    
}

//function escapeHTML(str) {str.replace(/[&"<>]/g, function (m) ({ "&": "&amp;", '"': "&quot", "<": "&lt;", ">": "&gt;" })[m]);}

function escapeHTML(str){return str;}

var WrHtml = "";
var originalTabId ;

var saveInServer = false;


function backwork(selection,pageUrl,context){


    return "<span>some fake return message</span>" ;

    //TODO URLEncode

      chrome.storage.sync.get({
        saveInServer: false 
      }, function(items) {
        saveInServer = items.saveInServer;
      });


    if(saveInServer){
    $.ajax({
        url: bank_url + selection + "&pageurl=" + 
              pageUrl + "&context=" + context ,
        success: function(data){}
    });}

    $.ajax({
        async: false,
        url: dic_url + selection.toLowerCase(),
        success: function(data) {
            var doc = data;
            var shop = "null";
            WrHtml = "";//clear it
            var hhitshop = doc.getElementsByTagName("dict");
            for (var i = 0; i< hhitshop.length; i++){
                shop =  hhitshop[i]; 

                var key = shop.getElementsByTagName("key")[0].firstChild.nodeValue;
                key = escapeHTML(key);

                if(shop.getElementsByTagName("ps").length > 0 || shop.getElementsByTagName("pos").length > 0){
                   // WrHtml += "<div id=key><strong>" + key + "</strong></div>";
                }else{
                   //WrHtml += "<div id=key><strong>Sorry, no definition found for the word.</strong></div>";
                }


                WrHtml += '<div class="phonetic">';

                for(var c = 0; c< shop.getElementsByTagName("ps").length; c++){
                    if(shop.getElementsByTagName("ps")[c].firstChild){
                        WrHtml += '<div class=ps><strong>[' + escapeHTML(shop.getElementsByTagName("ps")[c].firstChild.nodeValue) + ']</strong></div>';
                        WrHtml += '<audio controls><source src=' + escapeHTML(shop.getElementsByTagName("pron")[c].firstChild.nodeValue) +'></audio>';

                    }
                }

                WrHtml += '</div>';

                for (var e = 0; e< shop.getElementsByTagName("pos").length; e++){
                    WrHtml += "<p>";
                    if(shop.getElementsByTagName("pos")[e].firstChild){
                        WrHtml += "<strong>" + escapeHTML(shop.getElementsByTagName("pos")[e].firstChild.nodeValue) + "</strong>";
                        WrHtml += "&nbsp;&nbsp;&nbsp;";
                    }
                    WrHtml += escapeHTML(shop.getElementsByTagName("acceptation")[e].firstChild.nodeValue);
                    WrHtml += "</p>";
                 }
            }

        chrome.tabs.sendMessage(originalTabId,{dicMessage:WrHtml});
     },
     error: function(data) {
            $("#extradef").hide();
        }
    });


}

//below copied from the include/selection.js
var longPressTimer, isLoading, loaded, isLongPressing, mouseDown, initEvent, selection, startOffset, rangeParentNode, theSelection,theURL,theContext;


var cancelLongPress = function() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
}


var onKikinGesture = function(event){
//    console.log("bypassing the customDispatchEvent " + event.detail.status + " " + event.detail.reason );
}


window.addEventListener('mychromeGesture', onKikinGesture, true);
var customDispatchEvent = function(s, r) {
    window.dispatchEvent(new CustomEvent('mychromeGesture', {
        //TODO
        detail: {
            status: s,
            reason: r,
            target: initEvent.target
        }
    }));
}


var onMouseUp = function(e) {
    if (longPressTimer) {
        isLongPressing = false;
        cancelLongPress();
        customDispatchEvent('failed', 'short');
    }
    mouseDown = false;
    initEvent = null;

    startOffset = 0;
    rangeParentNode = null;
    console.log("The initEvent object was set to null, " + initEvent + " right?" );
};

var onMouseMove = function(e) {
    if (longPressTimer) {
        isLongPressing = false;
        cancelLongPress();
        customDispatchEvent('failed', 'move');
    }
}

var onScroll = function(e) {
    if (longPressTimer) {
        isLongPressing = false;
        cancelLongPress();
        customDispatchEvent('failed', 'scroll');
    }
}

var onLongPress = function(e) {
    console.log("Enter Long Pressing Detecting Mode");
    // check that there is no selected text
    var current = window.getSelection().toString();
    if (selection != current && current) {
        console.log("Game over");
        return};
    
    // update status
    isLongPressing = true;
    longPressTimer = null;

    console.log("Start to call the lookup communicate method");
    lookupWord();    
 
};


var startLoading = function(clbk) {
    // only load the thing once
    if (isLoading) return;
    isLoading = true;
    console.log("loading here");	
}


function onClick(e){

    var isLink = e.target.tagName == 'A' || (e.target.parentNode && e.target.parentNode.tagName == 'A');

    if(isLink && isLongPressing){
        e.preventDefault();
    }


}


function onMouseDown(e) {
    
    console.log("this is inside the mousedown check");
    // check if left click
    if (e.which != 1) return;
    
    // check if it's in an input
    if (/^(INPUT|TEXTAREA|SELECT|HTML)$/.exec(e.target.tagName)) return;
    
    // save infos
    isLongPressing = false;
    mouseDown = true;
    //There is no window object in the this script TODO 
    //selection = window.getSelection().toString();
    selection = "TODO"
    initEvent = e;
    startOffset = initEvent.rangeOffset;
    rangeParentNode = initEvent.rangeParent;
       
    console.log("The rangeParent of the event model " + initEvent.rangeParent);

    console.log("Support document caretRangeFromPoint" + document.caretRangeFromPoint());
    if(document.caretRangeFromPoint){
       console.log("Support document caretRangeFromPoint" + document.caretRangeFromPoint());
       range = document.caretRangeFromPoint(e.clientX, e.clientY);
       console.log("The original event position X is " +  e.clientX + " Y is " +  e.clientY);
       console.log("The range clicked by original event is " + range );
       rangeParentNode = range.startContainer;
       startOffset = range.startOffset; 
       console.log("The rangeParentNode found within the caretRangeFromPoint method is " + rangeParentNode );
    }

    theSelection = findTargetWord(startOffset, rangeParentNode);
    theURL = window.document.URL;
    theContext = rangeParentNode.textContent;
    console.log("In the onMouseDown handler show the original event range offset " + startOffset);
    console.log("In the onMouseDown handler show the window URL:" + window.document.URL);
    console.log("In the onMouseDown handler show the original event content " + rangeParentNode.textContent);
    
    // launch a timer to detect "long press"
    var isLink = e.target.tagName == 'A' || (e.target.parentNode && e.target.parentNode.tagName == 'A');
    longPressTimer = setTimeout(onLongPress, isLink ? 2000: 700);
};


function lookupWord(){
    //self.port.emit("lookup",theSelection,window.navigator.language);
    event_mouseup(initEvent);
    //self.port.emit("lookup",theSelection,'ja');
}

function findTargetWord(startOffset, parentNode){

    console.log("Enter find target word logic");
    table = [];
    
    console.log("Enter find target word logic 1");
    //disalbe this method for just right now
    console.log("Enter find target word logic 1.1");

    offset = startOffset;
    console.log("Enter find target word logic 1.2");
    
    console.log("Enter find target word logic 2");
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

    console.log("Enter find target word logic 3");
    while(backword>=0){
        if(! /[a-zA-Z]/.test(textarray[backword])){break;}
        else{
            table.splice(0,0,textarray[backword]);
        }
        backword -=1;
    }

    console.log("Enter find target word logic 4");
    while(forward <= textlen){
        if(! /[a-zA-Z]/.test(textarray[forward])){break;}
        else{
            table.push(textarray[forward]);
        }
        forward +=1;
    }

    var word = table.join("");
    console.log("Ready to print out the word");
    console.log(word);
    
    return word;



}


  //the LongClick handler
  window.addEventListener('mouseup', onMouseUp, true);
  window.addEventListener('click', onClick, true);
  window.addEventListener('mousedown', onMouseDown, true);
  window.addEventListener('mousemove', onMouseMove, true);
  window.addEventListener('scroll', onScroll, true);



