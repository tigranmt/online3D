TOOLS.Sculpturing = function () {

    var _this = this;
    var geodata = $.geoData;
    var geometry, geometryUnderMouse;
    var leftButtonPressed = false;
    var sculptureAdd = true, sculptureFlat = false, sculptureMorph = false;

    var leftDownPointY, leftCurrentPointY;

    var strength =0.1;
    var selsize = 20;
    var facesSelectedUnderMouse = {};

    var currentMeshName = "";

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

        currentMeshName = "";
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
                value = leftCurrentPointY - leftDownPointY ;
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


                var original = new THREE.Vector3(v.originalx, v.originaly, v.originalz); 

                v.x += x;
                v.y += y;
                v.z += z;

                v.originalx = v.x;
                v.originaly = v.y;
                v.originalz = v.z;

                geodata.updateVertexInfo(currentMeshName, original, v);
            }
            else if (sculptureFlat) {


                var original = new THREE.Vector3(v.originalx, v.originaly, v.originalz);

                v.x -= x;
                v.y -= y;
                v.z -= z;

                v.originalx = v.x;
                v.originaly = v.y;
                v.originalz = v.z;

                geodata.updateVertexInfo(currentMeshName, original, v);
            }
            else if (sculptureMorph) {

                v.x = v.originalx + x;
                v.y = v.originaly + y;
                v.z = v.originalz + z;
            }

        }


    }


    var reset = function (resetGeoData) {
        // reset variables 
        morphData.verticesToMorph = [];
        selectionAverageNormal = new THREE.Vector3();
        selectionNearestEdgeDistance = 10000;
        geometry = undefined;
        // ------

        if (resetGeoData) {
            //rebuild geo data
            geodata.rebuild();
        }
    }


   
    var collectData = function (event) {
        //find intersections
        var intersection = TOOLS.getIntersectionFromMouseCoord(event);
        if (intersection !== undefined) {

            //currentMeshName = intersection.object.name;
            //if (currentMeshName === "")
                currentMeshName = intersection.object.parent.name;

            geometry = intersection.object.geometry;

            var firstFace = intersection.face;
            if (!firstFace) {
                console.log("No picked faces on Sculpturing MouseDown");
                return;
            }

            //get all vertices of the just first face 
            var vertices = geodata.getVerticesOfFace(currentMeshName, firstFace);
            if (!vertices || vertices.length === 0) {
                console.log("No vertices specified in GeoData for picked face");
                return;
            }

            //get just first vertex of availabel ones 
            var firstVertex = vertices[0];
            selectionAverageNormal = geodata.getVertexAvgNormal(currentMeshName,firstVertex);

            var neigbourFaces = geodata.getNeigbourFaces(currentMeshName, firstVertex, selsize);

            var uniqueVertices = geodata.getVerticesOfFaces(currentMeshName, neigbourFaces);
            var edgeVertices = geodata.getEdgeVertices(currentMeshName, neigbourFaces);
            

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


    var resetColorOnTrianglesSelectedUnderMouse = function () {

        if (facesSelectedUnderMouse.length === 0 || !geometryUnderMouse)
            return;

        for (var n = 0; n < facesSelectedUnderMouse.length; n++) {
            var face = facesSelectedUnderMouse[n];
            if (face.originalColor)
                TOOLS.setColorOnFace(geometryUnderMouse, face, face.originalColor);
        }

        facesSelectedUnderMouse.length = 0;
        geometryUnderMouse.colorsNeedUpdate = true;
    }

    var selectTrianglesUnderMouse = function (event) {

        resetColorOnTrianglesSelectedUnderMouse();
        var intersection = TOOLS.getIntersectionFromMouseCoord(event);
        if (intersection !== undefined) {


            var meshName = intersection.object.parent.name;
            var face = intersection.face;

            geometryUnderMouse = intersection.object.geometry;

            var vertices = geodata.getVerticesOfFace(meshName, face);
            facesSelectedUnderMouse = geodata.getNeigbourFaces(meshName, vertices[0], selsize);

            for (var n = 0; n < facesSelectedUnderMouse.length; n++) {
                var f = facesSelectedUnderMouse[n];
                if (!f.originalColor)
                    f.originalColor = new THREE.Color().copy(f.color);

                TOOLS.setColorOnFace(geometryUnderMouse, f, "#ffffff");
            }
            geometryUnderMouse.colorsNeedUpdate = true;
        }
    }


    var onMouseDown = function (event) {
        if (!utils.isElementClicked(event, "canvas"))
            return;

        leftButtonPressed = event.button === 0;

        leftDownPointY = event.clientY;
        leftCurrentPointY = event.clientY;

        if (leftButtonPressed) {

            if (sculptureMorph) {
                reset(true);
                collectData(event);
            }

            sculpt(event);
        }



    };

    var onMouseMove = function (event) {

   

        if (event.altKey || event.ctrlKey)
            return;

        if (leftButtonPressed) {//left button

            if (geometry) {

                leftCurrentPointY = event.clientY;
                sculpt(event);
            }
        }
        else {
             selectTrianglesUnderMouse(event);
        }
    };

    var onMouseUp = function (event) {

        if (leftButtonPressed) {
         
            var resetGeoData = sculptureMorph;
            reset(resetGeoData);
        }

        leftButtonPressed = false;
        leftDownPointY = 0;
        leftCurrentPointY = 0;
        currentMeshName = "";
    };



};


//Point to point measurer
TOOLS.Sculpturing.prototype = TOOLS; 
TOOLS.Sculpturing.prototype.constructor = TOOLS.Tool(TOOLS.SCULPTURING);
