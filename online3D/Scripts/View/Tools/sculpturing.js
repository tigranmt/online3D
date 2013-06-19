TOOLS.Sculpturing = function () {

    var _this = this;
    var geodata = stlscene.graphics.geoData;
    var geometry;
    var leftButtonPressed = false;
    var sculptureAdd = true, sculptureFlat = false, sculptureMorph = false;

    var leftDownPointY, leftCurrentPointY;

    var strength =0.1;
    var selsize = 15;
    var facesSelectedUnderMouse = {};

    this.title = "Sculpture";
    this.text = "Choose a function to sculpt a model";
    this.htmlUI = "<div class='btn-group' data-toggle='buttons-radio'>" +
                    "<button id='scultureAdd' class='btn'>Add</button>" +
                    "<button id='sculptureFlat' class='btn'>Flat</button>" +
                     "<button id='sculptureMorph' class='btn'>Morph</button>" +
                  "</div>";

    this.uiWidth = 300;


    var morphData = {
        verticesToMorph: []
    };

    //An average normal of all selected triangles 
    var selectionAverageNormal = new THREE.Vector3();

    // The shortest distance from the EDGE vertex of the current selection 
    var selectionNearestEdgeDistance = 10000;

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

        $("#scultureAdd").on('click', function (event) {
            sculptureAdd = true;
            sculptureFlat = false;
            sculptureMorph = false;
        });


        $("#sculptureFlat").on('click', function (event) {

            sculptureAdd = false;
            sculptureFlat = true;
            sculptureMorph = false;
        });

        $("#sculptureMorph").on('click', function (event) {

            sculptureAdd = false;
            sculptureFlat = false;
            sculptureMorph = true;
        });
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


    var applyMorphingFunction = function (val) {
        return (Math.cos(val * Math.PI) + 1) / 2.0;
    }


    var sculpt = function (event) {


        //for mrphing data calculation is done only once
        if (!sculptureMorph) {
            reset();
            collectData(event);
        }

        if (geometry) {

            var value = strength;
            if (sculptureMorph) {
                value = leftDownPointY - leftCurrentPointY;
                value *= 0.08;
            }


            if (value < -50) {
                value = 0;
            }
            else if (value > 50)
                value = 50;

            morph(value);
            geometry.computeCentroids();
            geometry.computeFaceNormals();
            geometry.computeVertexNormals();

            geometry.verticesNeedUpdate = true;
            geometry.normalsNeedUpdate = true;
        }
    }

    var morph = function (distance) {
        for (var vm = 0; vm < morphData.verticesToMorph.length; vm++) {
            var vertexData = morphData.verticesToMorph[vm];
            var v = vertexData.vertex;
            var distanceToHead = vertexData.distanceToHead;

            var relativeDistance = distanceToHead / selectionNearestEdgeDistance;
            if (relativeDistance > 1.0)
                relativeDistance = 1.0;



            var movement = applyMorphingFunction(relativeDistance);
            movement *= distance;

            var x = selectionAverageNormal.x * movement
            var y = selectionAverageNormal.y * movement;
            var z = selectionAverageNormal.z * movement;

            if (sculptureAdd) {


                v.x += x;
                v.y += y;
                v.z += z;

                v.originalx = v.x;
                v.originaly = v.y;
                v.originalz = v.z;
            }
            else if (sculptureFlat) {
                v.x -= x;
                v.y -= y;
                v.z -= z;
            }
            else if (sculptureMorph) {

                v.x = v.originalx + x;
                v.y = v.originaly + y;
                v.z = v.originalz + z;
            }

        }
    }


    var reset = function () {
        // reset variables 
        morphData.verticesToMorph = [];
        selectionAverageNormal = new THREE.Vector3();
        selectionNearestEdgeDistance = 10000;
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

            var uniqueVertices = geodata.getVerticesOfFaces(neigbourFaces);
            var edgeVertices = geodata.getEdgeVertices(neigbourFaces);
            

            var length = uniqueVertices.length;
              
            for (var vv = 0; vv < length; vv++) {
                var v = uniqueVertices[vv];

                var distance = v.distanceTo(firstVertex);
                var key = geodata.getVertexKey(v);

               if (edgeVertices.hasOwnProperty(key)) {
                    //this is edge vertex 
                    if (distance < selectionNearestEdgeDistance)
                        selectionNearestEdgeDistance = distance;
                }
                else {
                    
                    var x = 0;
                    x++;
                }


                v.originalx = v.x;
                v.originaly = v.y;
                v.originalz = v.z;

                morphData.verticesToMorph.push({
                    vertex: v,
                    distanceToHead: distance
                });

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
                if (face.originalColor)
                    setColorOnFace(intersection.object.geometry, face, face.originalColor);
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

        leftDownPointY = event.clientY;
        leftCurrentPointY = event.clientY;

        if (leftButtonPressed) {

            if (sculptureMorph) {
                reset();
                collectData(event);
            }

            sculpt(event);
        }



    };

    var onMouseMove = function (event) {

        console.log(event.button);

        if (event.altKey || event.ctrlKey)
            return;

        if (leftButtonPressed) {//left button

            if (geometry) {

                leftCurrentPointY = event.clientY;
                sculpt(event);
            }
        }
        else {
            // selectTrianglesUnderMouse(event);
        }
    };

    var onMouseUp = function (event) {

        if (leftButtonPressed)
            reset();

        leftButtonPressed = false;
        leftDownPointY = 0;
        leftCurrentPointY = 0;
    };



};


//Point to point measurer
TOOLS.Sculpturing.prototype = TOOLS; 
TOOLS.Sculpturing.prototype.constructor = TOOLS.Tool(TOOLS.SCULPTURING);
