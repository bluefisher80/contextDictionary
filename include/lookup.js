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

var icon_url = chrome.extension.getURL("img/icon.svg");
var history_icon_url = chrome.extension.getURL("img/history.png");
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

$("#haloword-lookup").draggable({ handle: "#haloword-title" });

function event_mouseup(e) {
    console.log("final lookup method 2222 ");
    chrome.storage.local.get('disable_querybox', function(ret) {

        console.log("disable_querybox must be false now: " + ret.disable_querybox);
        if (!ret.disable_querybox) {

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
            chrome.runtime.sendMessage({selection: theSelection,theURL: theURL , theContext: theContext},function(response){
                $("#haloword-content").html(response.result);
            });

            $("#haloword-word").html(theSelection);
            $("#haloword-lookup").attr("style", "left: " + e.pageX + "px;" + "top: " + e.pageY + "px;");
            $("#haloword-close").click(function() {
                $("#haloword-lookup").hide();
                haloword_opened = false;
                return false;
            });

            $("#haloword-content").html("<p>Loading definitions...</p>");
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
    });
}

