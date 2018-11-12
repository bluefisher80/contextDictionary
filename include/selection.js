var longPressTimer, isLoading, loaded, isLongPressing, mouseDown, initEvent, selection, startOffset, rangeParentNode, theSelection,theURL,theContext;


var cancelLongPress = function() {
    clearTimeout(longPressTimer);
    longPressTimer = null;
}


var onKikinGesture = function(event){
    console.log("bypassing the customDispatchEvent " + event.detail.status + " " + event.detail.reason );
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



