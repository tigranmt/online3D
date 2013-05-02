TOOLS.MeshPencil = function () {

    var _this = this;
    var leftButtonPressed = false;

    this.color = "#00ffee"; //default selection color
    this.title = "Mesh pencil";
    this.text = "Choose a color and color mesh with mouse.";
    this.htmlUI = //"<div class='well'>" + 
			        "<div class='input-append color' data-color='" + this.color + "'  id='cpcolor'>" +
				        "<input type='text' class='span2' value='' readonly=''>" +
				        "<span class='add-on' style='cursor:pointer;'><i style='background-color:" + this.color + ";'></i></span>" +                      
                    "</div>" + 
                    "<div>" +
                      "<button id='colorAllModelButton' type='button' class='btn btn-primary btn-small btn-success' data-toggle='buttons-radio'>Color all model</button>" + 
                    "</div>"
                    
    //"</div>";

    this.uiWidth = 300;


    this.isCanvasClicked = function (event) {
        var elementName = (event.srcElement)? event.srcElement.localName.toLowerCase() : event.originalTarget.localName.toLowerCase() ;
        return elementName === "canvas";
    }


    this.start = function () {
        console.log("Start mesh pencil");
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mousedown', onMouseDown, true);
        document.addEventListener('mouseup', onMouseUp, false);
        TOOLS.current = _this;
        this.colorAllModel = false;

        $('#cpcolor').colorpicker().on('changeColor', function (ev) {
            _this.color = ev.color.toHex();
        });

        $("#colorAllModelButton").on('click', function () {
            _this.colorAllModel = !_this.colorAllModel;
        });

    };

    this.startAgent = function () {
        console.log("No agent call for " + this.title + " expected");
    };



    this.stop = function () {
        console.log("Stop mesh pencil");
        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mousedown', onMouseDown, true);
        document.removeEventListener('mouseup', onMouseUp, false);
    };

    var onMouseDown = function (event) {
        if (!_this.isCanvasClicked(event)) 
            return;

        leftButtonPressed = event.button === 0;
          
        if (_this.colorAllModel && leftButtonPressed) {

            //find intersections
            var intersection = TOOLS.getIntersectionFromMouseCoord(event);
            if (intersection !== undefined) {
                //iterate over ALL faces of the model and set selected color
                var faces = intersection.object.geometry.faces;
                for (var n = 0; n < faces.length; n++)
                    setColorOnFace(intersection.object.geometry, faces[n], _this.color);
                intersection.object.geometry.colorsNeedUpdate = true;
            }
        }        

      
       
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
        face.color.set(color);
        geometry.vertices[face.a].vertexColor = color;
        geometry.vertices[face.b].vertexColor = color;
        geometry.vertices[face.c].vertexColor = color;

    };


    var onMouseMove = function (event) {

        console.log(event.button);

        if (event.altKey || event.ctrlKey)
            return;

        if (leftButtonPressed && !this.colorAllModel) {//left button
            var intersection = TOOLS.getIntersectionFromMouseCoord(event);
            if (intersection !== undefined) {
                setColorOnFace(intersection.object.geometry, intersection.face, _this.color);
                var neigbours = getNeighbours(intersection.object.geometry, intersection.face);
                for (var n = 0; n < neigbours.length; n++)
                    setColorOnFace(intersection.object.geometry, neigbours[n], _this.color);
                intersection.object.geometry.colorsNeedUpdate = true;
            }
        }
    };

}

//Point to point measurer
TOOLS.MeshPencil.prototype = {
    constructor: TOOLS.Tool(TOOLS.MESH_PENCIL)
};