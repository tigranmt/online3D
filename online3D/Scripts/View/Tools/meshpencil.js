TOOLS.MeshPencil = function () {

    var _this = this;
    var leftButtonPressed = false;
    var currentMeshName = "";

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
        currentMeshName = "";
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
                for (var n = 0; n < faces.length; n++) {
                    TOOLS.setColorOnFace(intersection.object.geometry, faces[n], _this.color, true);
                }

                intersection.object.geometry.colorsNeedUpdate = true;
                intersection.object.color = _this.color;
            }

          
        }        

      
       
    };

    var onMouseUp = function (event) {

     
        leftButtonPressed = false;
        currentMeshName = "";
    };

   

    var getNeighbours = function (geometry, face) {
      
        var neighbours = [];
   
        var na = stlscene.graphics.geoData.getNeigbourFaces(currentMeshName, geometry.vertices[face.a], 5);
        var nb = stlscene.graphics.geoData.getNeigbourFaces(currentMeshName, geometry.vertices[face.b], 5);
        var nc = stlscene.graphics.geoData.getNeigbourFaces(currentMeshName, geometry.vertices[face.c], 5);

   
        neighbours = neighbours.concat(na);
        neighbours = neighbours.concat(nb);
        neighbours = neighbours.concat(nc);

        return neighbours;
    };


    


    var onMouseMove = function (event) {

        console.log(event.button);

        if (event.altKey || event.ctrlKey)
            return;

        if (leftButtonPressed && !this.colorAllModel) {//left button
            var intersection = TOOLS.getIntersectionFromMouseCoord(event);
            if (intersection !== undefined) {


                //currentMeshName = intersection.object.name;
                //if (currentMeshName === "")
                currentMeshName = intersection.object.parent.name;

                TOOLS.setColorOnFace(intersection.object.geometry, intersection.face, _this.color);
                var neigbours = getNeighbours(intersection.object.geometry, intersection.face);
                for (var n = 0; n < neigbours.length; n++)
                    TOOLS.setColorOnFace(intersection.object.geometry, neigbours[n], _this.color);
                intersection.object.geometry.colorsNeedUpdate = true;
            }
        }
    };

}

//Point to point measurer
TOOLS.MeshPencil.prototype = TOOLS; 
TOOLS.MeshPencil.prototype.constructor = TOOLS.Tool(TOOLS.MESH_PENCIL);
  