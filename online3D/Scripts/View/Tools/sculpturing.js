TOOLS.Sculpturing = function () {

    var _this = this;
    var geodata = stlscene.graphics.geoData;
    var geometry;
    var leftButtonPressed = false;


    var strength = 0.2;
    var selsize = 5;
    var facesSelectedUnderMouse = {};

    this.title = "Sculpture";
    this.text = "Choose a function to sculpt a model";
    //this.htmlUI = //"<div class='well'>" + 
	//		        "<div class='input-append color' data-color='" + this.color + "'  id='cpcolor'>" +
	//			        "<input type='text' class='span2' value='' readonly=''>" +
	//			        "<span class='add-on' style='cursor:pointer;'><i style='background-color:" + this.color + ";'></i></span>" +
    //                "</div>" +
    //                "<div>" +
    //                  "<button id='colorAllModelButton' type='button' class='btn btn-primary btn-small btn-success' data-toggle='buttons-radio'>Color all model</button>" +
    //                "</div>"

    //"</div>";

    this.uiWidth = 300;


    var morphData = {
        verticesToMorph : []
    };

    //An average normal of all selected triangles 
    var selectionAverageNormal = new THREE.Vector3();

    // Maximum distance found among all selected vertices in collection 
    // to the first slected vertex (vertex)
    var maxDistanceToHeadOfSelection = 0; 

    this.isCanvasClicked = function (event) {
        var elementName = (event.srcElement) ? event.srcElement.localName.toLowerCase() : event.originalTarget.localName.toLowerCase();
        return elementName === "canvas";
    }


    this.start = function () {
        console.log("Start sculpturing");
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mousedown', onMouseDown, true);
        document.addEventListener('mouseup', onMouseUp, false);
        TOOLS.current = _this;
    };

    this.startAgent = function () {
        console.log("No agent call for " + this.title + " expected");
    };



    this.stop = function () {
        console.log("Stop sculpturing");
        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mousedown', onMouseDown, true);
        document.removeEventListener('mouseup', onMouseUp, false);
    };


    var applyMorphingFunction = function(val)
    {
          return (Math.cos(val * Math.PI) + 1) / 2;
    }


    var sculptPlus = function () {
       

        reset();
        collectData(event);

        if (geometry) {
            morph();

       
            geometry.computeCentroids();
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();

            geometry.verticesNeedUpdate = true;
            geometry.normalsNeedUpdate = true;
        }
    }

    var morph = function () {
        for (var vm = 0; vm < morphData.verticesToMorph.length; vm++) {
            var vertexData = morphData.verticesToMorph[vm];
            var v = vertexData.vertex;
            var distance = vertexData.distanceToHead;

            var relativeDistance = distance / maxDistanceToHeadOfSelection;
            if (relativeDistance > 1.0)
                relativeDistance = 1.0;

          

            var movement = applyMorphingFunction(relativeDistance);
            movement *= strength;

            var x = selectionAverageNormal.x * movement
            var y = selectionAverageNormal.y * movement;
            var z = selectionAverageNormal.z * movement;


            v.x += x;
            v.y += y;
            v.z += z;
        }
    }


    var reset = function () {
        // reset variables 
        morphData.verticesToMorph = [];
        selectionAverageNormal = new THREE.Vector3();
        maxDistanceToHeadOfSelection = 0;
        geometry = undefined;
        // ------

        //rebuild geo data
        geodata.rebuild();
    }

    var collectData = function (event) {
        //find intersections
        var intersection = TOOLS.getIntersectionFromMouseCoord(event);
        if (intersection !== undefined) {


            geometry = intersection.object.geometry;

            var firstFace = intersection.face;
            if (!firstFace) {
                console.log("No picked faces on Sculpturing MouseDown");
                return;
            }

            //get all vertices of the just first face 
            var vertices = geodata.getVerticesOfFace(firstFace);
            if (!vertices || vertices.length === 0) {
                console.log("No vertices specified in GeoData for picked face");
                return;
            }

            //get just first vertex of availabel ones 
            var firstVertex = vertices[0];
            selectionAverageNormal = geodata.getVertexAvgNormal(firstVertex);

            var neigbourFaces = geodata.getNeigbourFaces(firstVertex, selsize);

            for (var f = 0; f < neigbourFaces.length; f++) {
                var ff = neigbourFaces[f];
                var facevertices = geodata.getVerticesOfFace(ff);
                for (var vv = 0; vv < facevertices.length; vv++) {
                    var v = facevertices[vv];

                    var distance = v.distanceTo(firstVertex);
                    if (distance > maxDistanceToHeadOfSelection)
                        maxDistanceToHeadOfSelection = distance;

                    morphData.verticesToMorph.push({
                        vertex: v,
                        distanceToHead: distance
                    });

                }
            }
        }


    }


    var setColorOnFace = function (geometry, face, color, onlyface) {

        face.color.set(color);

        /*do not need coloring of the vertices*/
        if (onlyface === true)
            return;

        geometry.vertices[face.a].vertexColor = color;
        geometry.vertices[face.b].vertexColor = color;
        geometry.vertices[face.c].vertexColor = color;

    };



    var selectTrianglesUnderMouse = function (event) {

        var intersection = TOOLS.getIntersectionFromMouseCoord(event);
        if (intersection !== undefined) {

            for (var n = 0; n < facesSelectedUnderMouse.length; n++) {
                var face = facesSelectedUnderMouse[n]; 
                if(face.originalColor)
                    setColorOnFace(intersection.object.geometry,  face, face.originalColor);
            }

            var face = intersection.face;
            var vertices = geodata.getVerticesOfFace(face); 
            facesSelectedUnderMouse = geodata.getNeigbourFaces(vertices[0], selsize);

            for (var n = 0; n < facesSelectedUnderMouse.length; n++) {
                var face = facesSelectedUnderMouse[n];
               
                setColorOnFace(intersection.object.geometry, facesSelectedUnderMouse[n], "#ffffff");
            }
            intersection.object.geometry.colorsNeedUpdate = true;
        }
    }


    var onMouseDown = function (event) {
        if (!_this.isCanvasClicked(event))
            return;

        leftButtonPressed = event.button === 0;

        if (leftButtonPressed) {
            sculptPlus();
        }



    };

    var onMouseMove = function (event) {

        console.log(event.button);

        if (event.altKey || event.ctrlKey)
            return;

        if (leftButtonPressed) {//left button

            if (geometry) {
                sculptPlus();
            }
        }
        else {
           // selectTrianglesUnderMouse(event);
        }
    };

    var onMouseUp = function (event) {

        if(leftButtonPressed)
            reset();

        leftButtonPressed = false;
    };



};


//Point to point measurer
TOOLS.Sculpturing.prototype = TOOLS; 
TOOLS.Sculpturing.prototype.constructor = TOOLS.Tool(TOOLS.SCULPTURING);
