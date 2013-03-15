TOOLS.NotesManager = function () {

    var lastAddedNotePoint = undefined;

    var _this = this;

    this.start = function () {
        console.log("No agent call for " + this.title + " expected");
    };

    this.startAgent = function () {
        console.log("Start " + this.title + " agent");

        lastAddedNotePoint = undefined;
        document.addEventListener('mouseup', onMouseUp, false);
    };


    this.stopAgent = function () {
        console.log("No stop call for " + this.title + " expected");

        this.removeLastPoint();

        lastAddedNotePoint = undefined;
        document.removeEventListener('mouseup', onMouseUp, false);

    };

    this.stop = function () {
        console.log("No stop call for " + this.title + " expected");
    };


    this.getPoint = function () {
        if (lastAddedNotePoint === undefined)
            return new THREE.Vector3();
        else
            return lastAddedNotePoint.notePoint;
    };


    this.addPoint = function (point) {

        if (point.x === 0 && point.y === 0 && point.z === 0)
            return; 

        var meshSphere = createMeshFromPoint(point);
        lastAddedNotePoint = meshSphere;
        TOOLS.addMesh(meshSphere);
    };


    this.removeLastPoint = function () {
        if (lastAddedNotePoint !== undefined) {
            TOOLS.removeMesh(lastAddedNotePoint);
            lastAddedNotePoint = undefined;
        }
    }

    var createMeshFromPoint = function (point) {

        var sphere = new THREE.SphereGeometry(0.15, 16, 8);

        var redMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });

        var meshSphere = new THREE.Mesh(sphere, redMaterial);
        meshSphere.position = point;
        meshSphere.notePoint = point;

        return meshSphere;
    };

    var addPoint = function (event) {
        //get point on mesh from mouse args

        if (event === undefined) return;

        if (event.button !== 0) return;

        var intersection = TOOLS.getIntersectionFromMouseCoord(event);
        if (intersection !== undefined) {

            //remove last added 
            _this.removeLastPoint();
            _this.addPoint(intersection.point);
        }

    };

    var onMouseUp = function (event) {
        addPoint(event);
    };

}


//Notes manager
TOOLS.NotesManager.prototype = {
    constructor: TOOLS.Tool(TOOLS.NOTES_MANAGER)
};