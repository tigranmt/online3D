TOOLS.SelectionManager = function () {


    var _this = this;
    var regionSelectionStarted = false;

    this.start = function () {
        console.log("No agent call for " + this.title + " expected");
    };

    this.startAgent = function () {
        console.log("Start " + this.title + " agent");

        lastAddedNotePoint = undefined;
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('mouseup', onMouseUp, false);
        document.addEventListener('mousemove', onMouseMove, false);
    };


    this.stopAgent = function () {
        console.log("No stop call for " + this.title + " expected");

        document.removeEventListener('mousedown', onMouseDown, false);
        document.removeEventListener('mouseup', onMouseUp, false);
        document.removeEventListener('mousemove', onMouseMove, false);

    };

    this.stop = function () {
        console.log("No stop call for " + this.title + " expected");
    };


    var surfaceSelection = function (face) {

    }


    var onMouseDown = function (event) {
        if (event === undefined) return;

        if (event.button !== 0) return;

        var intersection = TOOLS.getIntersectionFromMouseCoord(event);

        //there is an intersection so make a surface selection 
        if (intersection !== undefined) {

            regionSelectionStarted = false;
            surfaceSelection(intersection.face);
        }
        else {
            regionSelectionStarted = true;
        }
    };

    var onMouseUp = function (event) {
        regionSelectionStarted = false;
    };

    var onMouseMove = function (event) {
        if (event === undefined) return;
        if (event.button !== 0) return;
        if (!regionSelectionStarted) return;
    };

}


//Notes manager
TOOLS.NotesManager.prototype = TOOLS;
TOOLS.NotesManager.prototype.constructor = TOOLS.Tool(TOOLS.SELECTION);