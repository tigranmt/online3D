TOOLS.MeshPencil = function () {

    var _this = this;
    var leftButtonPressed = false;

    var hexToRgba = function (hex) {
        var c = hex;
        var r = (c & (0xff << 24)) >>> 24;
        var g = (c & (0xff << 16)) >>> 16;
        var b = (c & (0xff << 8)) >>> 8;
        var a = (c & 0xff) / 0xff;
        return 'rgba(' + [r, g, b, a].join(',') + ')';
    };

    this.color = 0xffee99; //default selection color
    this.title = "Mesh pencil";
    this.text = "Choose a color and color mesh with mouse.";
    this.htmlUI = //"<div class='well'>" + 
			        "<div class='input-append color' data-color='" + hexToRgba(this.color) + "'  id='cpcolor'>" +
				        "<input type='text' class='span2' value='' readonly=''>" +
				        "<span class='add-on' style='cursor:pointer;'><i style='background-color:" + hexToRgba(this.color) + ";'></i></span>" +
			        "</div>";
    //"</div>";

    this.uiWidth = 300;


    this.start = function () {
        console.log("Start mesh pencil");
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mousedown', onMouseDown, false);
        document.addEventListener('mouseup', onMouseUp, false);
        TOOLS.current = _this;

        $('#cpcolor').colorpicker().on('changeColor', function (ev) {
            _this.color = ev.color.toHex();
        });


    };



    this.stop = function () {
        console.log("Stop mesh pencil");
        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mousedown', onMouseDown, false);
        document.removeEventListener('mouseup', onMouseUp, false);
    };

    var onMouseDown = function (event) {
        leftButtonPressed = event.button === 0;
    };

    var onMouseUp = function (event) {
        leftButtonPressed = false;
    };

    var keyfromVertex = function (v) {
        if (v === undefined)
            return;
        var precisionPoints = 4; // number of decimal points, eg. 4 for epsilon of 0.0001
        var precision = Math.pow(10, precisionPoints);
        return [Math.round(v.x * precision), Math.round(v.y * precision), Math.round(v.z * precision)].join('_');
    };

    var getNeighbours = function (geometry, face) {

        var vertexMap = {};
        var neighbours = new Array();

        vertexMap[keyfromVertex(geometry.vertices[face.a])] = 0;
        vertexMap[keyfromVertex(geometry.vertices[face.b])] = 1;
        vertexMap[keyfromVertex(geometry.vertices[face.c])] = 2;

        for (var i = 0; i < geometry.faces.length; i++) {

            var neigbourFace = geometry.faces[i];
            if (vertexMap[keyfromVertex(geometry.vertices[neigbourFace.a])] !== undefined ||
                    vertexMap[keyfromVertex(geometry.vertices[neigbourFace.b])] !== undefined ||
                        vertexMap[keyfromVertex(geometry.vertices[neigbourFace.c])] !== undefined) {
                neighbours.push(neigbourFace);
            }
        }


        return neighbours;
    };


    var setColorOnFace = function (geometry, face, color) {
        face.color.set(color)
//        if (geometry.faceColors === undefined)
//            geometry.faceColors = {};
//        if (geometry.faceColors[color] === undefined)
//            geometry.faceColors[color] = new Array();
//        geometry.faceColors[color].push(face.a);
//        geometry.faceColors[color].push(face.b);
//        geometry.faceColors[color].push(face.c);
    };


    var onMouseMove = function (event) {

        console.log(event.button);

        if (event.altKey || event.ctrlKey)
            return;

        if (leftButtonPressed) {//left button
            var intersection = TOOLS.getIntersectionFromMouseCoord(event);
            if (intersection !== undefined) {
                setColorOnFace(intersection.object.geometry, intersection.face, _this.color);
                var neigbours = getNeighbours(intersection.object.geometry, intersection.face);
                for (var n = 0; n < neigbours.length; n++)
                    neigbours[n].color.set(_this.color);
                intersection.object.geometry.colorsNeedUpdate = true;
            }
        }
    };

}

//Point to point measurer
TOOLS.MeshPencil.prototype = {
    constructor: TOOLS.Tool(TOOLS.MESH_PENCIL)
};