TOOLS.NotesManager = function () {

    this.start = function () {
        console.log("No agent call for " + this.title + " expected");
    };

    this.startAgent = function () {
        console.log("Start " + this.title + " agent");     
       
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('mouseup', onMouseUp, false);      
    };

    this.stop = function () {
        console.log("No stop call for " + this.title + " expected");

    };


    var onMouseDown = function (event) {
        leftButtonPressed = event.button === 0;
    };

    var onMouseUp = function (event) {
        leftButtonPressed = false;
    };
}


//Notes manager
TOOLS.NotesManager.prototype = {
    constructor: TOOLS.Tool(TOOLS.NOTES_MANAGER)
};