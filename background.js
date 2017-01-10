var WrHtml = "";
chrome.runtime.onMessage.addListener(
          function(request, sender, sendResponse) {
              console.log("this is the receive method");
                  console.log(sender.tab ?
                                  "from a content script:" + sender.tab.url :
                                  "from the extension");

                      if (request.greeting == "hello")
                          backwork("hello","url","context");
                                sendResponse({farewell: WrHtml});
                        });



function backwork(selection,pageUrl,context){

    $.ajax({
            url: bank_url + selection + "&pageurl=" + pageUrl + "&context=" + "this is the context",
                    success: function(data){}
            }
          );

    $.ajax({
        url: dic_url + selection.toLowerCase(),
        success: function(data) {
        
        var doc = data;
        var shop = "null";
        //var WrHtml = "";
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


        },
        error: function(data) {
            $("#extradef").hide();
        }
    });


}



