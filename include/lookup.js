function is_chinese(word) {
    return (/^[\u4e00-\u9fa5]+$/g).test(word);
}

//function escapeHTML(str) {str.replace(/[&"<>]/g, function (m) ({ "&": "&amp;", '"': "&quot", "<": "&lt;", ">": "&gt;" })[m]);}

function escapeHTML(str){return str;}

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
#haloword-open { background: url(" + icon_url + ") -94px -17px; }\
#haloword-open:hover { background: url(" + icon_url + ") -111px -17px; }\
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
    // chrome.storage.local.set({'disable_querybox': true})
    chrome.storage.local.get('disable_querybox', function(ret) {
        if (!ret.disable_querybox) {
            if (!e.ctrlKey && !e.metaKey) {
                return;
            }
            var selection = $.trim(window.getSelection());
            if (!selection) {
                $("iframe").each(function() {
                    if (this.contentDocument) {
                        selection = $.trim(this.contentDocument.getSelection());
                    }
                    if (selection) {
                        return false;
                    }
                });
            }
            var lang = valid_word(selection);
            if (!lang) {
                return;
            }

            $("#haloword-word").html(selection);
            $("#haloword-lookup").attr("style", "left: " + e.pageX + "px;" + "top: " + e.pageY + "px;");
            $("#haloword-open").attr("href", chrome.extension.getURL("main.html#" + selection));
            $("#haloword-close").click(function() {
                $("#haloword-lookup").hide();
                haloword_opened = false;
                return false;
            });

            $("#haloword-pron").hide();
            $("#haloword-content").html("<p>Loading definitions...</p>");
            $("#haloword-lookup").show();

            $.ajax({
                url: dic_url + selection.toLowerCase(),
                success: function(data) {
                
                var doc = data;
                var shop = "null";
                var WrHtml = "";
                var hhitshop = doc.getElementsByTagName("dict");
                for (var i = 0; i< hhitshop.length; i++){
                    shop =  hhitshop[i]; 
                    WrHtml += '<p class="phonetic"><span> ';

                    for(var c = 0; c< shop.getElementsByTagName("ps").length; c++){
                        if(shop.getElementsByTagName("ps")[c].firstChild){
                            WrHtml += '[' + escapeHTML(shop.getElementsByTagName("ps")[c].firstChild.nodeValue) + ']';
                            WrHtml += "&nbsp;&nbsp;&nbsp;";
                        }
                    }

                    WrHtml += '</span></p>';

                    for (var e = 0; e< shop.getElementsByTagName("pos").length; e++){
                        WrHtml += "<p>";
                        if(shop.getElementsByTagName("pos")[e].firstChild){
                            WrHtml += escapeHTML(shop.getElementsByTagName("pos")[e].firstChild.nodeValue);
                            WrHtml += "&nbsp;&nbsp;&nbsp;";
                        }
                        WrHtml += escapeHTML(shop.getElementsByTagName("acceptation")[e].firstChild.nodeValue);
                        WrHtml += "</p>";
                     }
                }


                            $("#haloword-content").html(WrHtml);
                },
                error: function(data) {
                    $("#extradef").hide();
                }
            });

            // HACK: fix dict window not openable
            setTimeout(function() {
                haloword_opened = true;
            }, 100);
        }
    })
}

