
//function escapeHTML(str) {str.replace(/[&"<>]/g, function (m) ({ "&": "&amp;", '"': "&quot", "<": "&lt;", ">": "&gt;" })[m]);}

function escapeHTML(str){return str;}

var WrHtml = "";
var originalTabId ;

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
      originalTabId = sender.tab.id;
      console.log("this is background receive method,got message from tab " + sender.tab.id);
      console.log("Start the xhr ajax query request to dic engine");
      backwork(request.selection,request.theURL,request.theContext);
      sendResponse({"result" : WrHtml});
  });



function backwork(selection,pageUrl,context){

    //TODO URLEncode
    $.ajax({
        url: bank_url + selection + "&pageurl=" + 
              pageUrl + "&context=" + context ,
        success: function(data){}
    });

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



