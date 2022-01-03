var dic_url = "http://dict-co.iciba.com/api/dictionary.php?key=9A801B3C3A8D0AB5A5059C2F4B71AC50&w=";
var bank_url = "http://www.context-dictionary.com:8080/add/?word=" ;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    fetch(bank_url + message.selection + "&pageurl=" + message.theURL + "&context=" + message.theContext);
    fetch(dic_url + message.selection.toLowerCase()).then(response => response.text())
        .then(data => sendResponse(data));


    // return true from the event listener to indicate you wish to send a response asynchronously
    // (this will keep the message channel open to the other end until sendResponse is called).
    return true;
});


var originalTabId ;

var saveInServer = false;

function backwork(selection,pageUrl,context){

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

}



