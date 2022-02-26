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

var haloword_html = '<div id="haloword-lookup" class="ui-widget-content" draggable="true">\
<div id="haloword-title">\
<span id="haloword-word"></span>\
<div id="haloword-control-container-if">\
</div>\
<div id="haloword-control-container">\
 <!-- <a herf="#" id="haloword-close" class="haloword-button" title="关闭查询窗"></a> -->\
 <span><a href="http://www.context-dictionary.com/list/" target="_blank" title="查询历史">history</a></span>\
</div>\
<br style="clear: both;" />\
</div><div id="haloword-content"></div></div>';

//$("body").append(haloword_html);

var div = document.createElement('div');
div.className = 'tooltip';
div.id = 'op';
div.style.cssText = 'position: absolute; z-index: 999; height: 16px; width: 16px; top:70px';
div.innerHTML = haloword_html;

document.body.appendChild(div);

console.log("How many bodies in the page loading");
// deal with Clearly



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

$("body").click(event_click);

function event_click(event) {
    console.log("this method was triggered in the event_click method");
    console.log("In event_click, the type of the event is " + event.type);
    if (haloword_opened && !isLongPressing) {
        var target = $(event.target);
        if (target.attr("id") != "haloword-lookup" && !target.parents("#haloword-lookup")[0]) {
            document.getElementById("haloword-lookup").style.display = "none";
            haloword_opened = false;
        }
    }
}

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

//$("#haloword-lookup").draggable({ handle: "#haloword-title" });

function handle_longpressing(event) {
    console.log("final lookup method in the handle_longpressing handler, current event type is " + event.type);

        if (!isLongPressing &&  !(event.ctrlKey || event.metaKey) ) {
            console.log("keys detection,but user random click without modify key down case, ignore the target word: ", theSelection);
            return;
        }

        var lang2 = valid_word(theSelection);
        if (!lang2) {
            console.log("word detection");
            return;
        }

        var result;

        chrome.runtime.sendMessage({selection: theSelection,theURL: theURL , theContext: theContext}, (response) => {
            console.log('received user data in promise action, prepare to parse for the data and show it' );
            document.getElementById("haloword-content").innerHTML = parseDicData(response);

        });

        document.getElementById("haloword-word").innerHTML = theSelection;
//        $("#haloword-lookup").attr("style", "left: " + event.pageX + "px;" + "top: " + event.pageY + "px;");

        document.getElementById("haloword-lookup").style.left = event.pageX + "px";
        document.getElementById("haloword-lookup").style.top = event.pageY + "px";
        document.getElementById("haloword-lookup").style.display = "block";

        document.getElementById("haloword-content").innerHTML = "<p>Loading definitions...</p>"
        console.log("handle_longpressing method,the #halowword-lookup div is shown.  ");

        // HACK: fix dict window not openable

        setTimeout(function() {
            haloword_opened = true;
        }, 100);
    
}



function escapeHTML(str){return str;}

function parseDicData(data){
            var parser = new DOMParser();
            var xml = parser.parseFromString(data, "application/xml");
            var shop = "null";
            WrHtml = "";//clear it
            var hhitshop = xml.getElementsByTagName("dict");
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

    return WrHtml;
}
