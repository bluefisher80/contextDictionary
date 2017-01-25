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
<a herf="#" id="haloword-pron" class="haloword-button" title="发音"></a>\
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

var icon_url = chrome.extension.getURL("img/icon.svg");
var style_content = "<style>\
#haloword-pron { background: url(" + icon_url + ") -94px -34px; }\
#haloword-pron:hover { background: url(" + icon_url + ") -111px -34px; }\
#haloword-close { background: url(" + icon_url + ") -94px 0; }\
#haloword-close:hover { background: url(" + icon_url + ") -111px 0; }</style>";
if ($("head")[0]) {
    $($("head")[0]).append(style_content);
}
else {
    $($("body")[0]).prepend(style_content);
}

$("#haloword-lookup").draggable({ handle: "#haloword-title" });

function event_mouseup(e) {
    console.log("final lookup method, the event_mouseup method");
    chrome.storage.local.get('disable_querybox', function(ret) {

        console.log("disable_querybox must be false now: " + ret.disable_querybox);
        if (!ret.disable_querybox) {

            //if ((!e.ctrlKey && !e.metaKey) && !isLongPressing) {
            if (!isLongPressing &&  !(e.ctrlKey || e.metaKey) ) {
                console.log("keys detection,but user random click without modify key down case, ignore it.");
                console.log("the Long click word is " + theSelection);
                return;
            }

            var selection = $.trim(window.getSelection());
//comment out for http://stackoverflow.com/questions/25098021/securityerror-blocked-a-frame-with-origin-from-accessing-a-cross-origin-frame
/**
            if (!selection) {
                console.log("Debug 1");
                $("iframe").each(function() {
                    if (this.contentDocument) {
                        console.log("Debug 2");
                        selection = $.trim(this.contentDocument.getSelection());
                    }
                    if (selection) {
                        console.log("Debug 3");
                        return false;
                    }
                });
            }
*/
            console.log("check the original word selection" + selection);
            var lang1 = valid_word(selection);
            var lang2 = valid_word(theSelection);
            if (!lang1 && !lang2) {
                console.log("word detection");
                return;
            }


            if(!selection){
                selection = theSelection;
            }

            var result;
            chrome.runtime.sendMessage({selection: selection,theURL: theURL , theContext: theContext},function(response){
                $("#haloword-content").html(response.result);
            });

            $("#haloword-word").html(selection);
            $("#haloword-lookup").attr("style", "left: " + e.pageX + "px;" + "top: " + e.pageY + "px;");
            $("#haloword-close").click(function() {
                $("#haloword-lookup").hide();
                haloword_opened = false;
                return false;
            });

            $("#haloword-pron").hide();
            $("#haloword-content").html("<p>Loading definitions...</p>");
            $("#haloword-lookup").show();
            //
            
            console.log("mouse up method  in the page script");
            // HACK: fix dict window not openable
            setTimeout(function() {
                haloword_opened = true;
            }, 100);
        }
    })
}

