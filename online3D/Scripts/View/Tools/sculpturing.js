TOOLS.Sculpturing = function () {

    var _this = this;
    var geodata = stlscene.graphics.geoData;
    var geometry;
    var leftButtonPressed = false;
    var sculptureAdd = true, sculptureFlat = false, sculptureMorph = false;

    var leftDownPointY, leftCurrentPointY;

    var strength = 40;
    var selsize = 5;
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
        return (Math.cos(val * Math.PI) + 1) / 2;
    }


    var sculpt = function () {


        //for mrphing data calculation is done only once
        if (!sculptureMorph) {
            reset();
            collectData(event);
        }

        if (geometry) {

            var value = strength;
            if (sculptureMorph)
                value = leftDownPointY - leftCurrentPointY;


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
            var distance = vertexData.distanceToHead;

            var relativeDistance = distance / maxDistanceToHeadOfSelection;
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
        maxDistanceToHeadOfSelection = 0;
        geometry = undefined;
        // ------

        //rebuild geo data
        geodata.rebuild();
    }


    var meshAverageVector = function (mesh, vertex) {
        var geometry = mesh.geometry;
        var faces = geometry.faces;       
        var facesLength = faces.length;
        var avgNormal = new THREE.Vector3(0, 0, 0);
        var twoLines = [new THREE.Vector3(), new THREE.Vector3()];

        for (var i = 0; i < facesLength; i++) {
            var face = faces[i];
            var vertices = geodata.getVerticesOfFace(face);
            for (var v = 0; v < vertices.length; v++) {
                var ve = vertices[v];
                if (ve == vertex)
                    continue;

                twoLines[1] = twoLines[0];
                var v0 = new THREE.Vector3(ve.x, ve.y, ve.z);
                var v1 = new THREE.Vector3(ve.x, ve.y, ve.z);
                v1.addVectors(v1, v0);
                twoLines[0] = v1;
            }

            var normal = geodata.computeFaceNormal(face);
            var angle = twoLines[0].angleTo(twoLines[1]);
            var multiplied = normal.multiplyScalar(angle);
            avgNormal.addVectors(avgNormal, multiplied);
        }


        avgNormal.multiplyScalar(1.0 / facesLength);
        return avgNormal;
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
            selectionAverageNormal = meshAverageVector(intersection.object, firstVertex);

            var neigbourFaces = geodata.getNeigbourFaces(firstVertex, selsize);

            for (var f = 0; f < neigbourFaces.length; f++) {

                var ff = neigbourFaces[f];

                var normal = geodata.computeFaceNormal(ff);
                var angle = normal.angleTo(selectionAverageNormal);
                if (angle < 3)
                    continue;

                var facevertices = geodata.getVerticesOfFace(ff);
                for (var vv = 0; vv < facevertices.length; vv++) {
                    var v = facevertices[vv];

                    var distance = v.distanceTo(firstVertex);
                    if (distance > maxDistanceToHeadOfSelection)
                        maxDistanceToHeadOfSelection = distance;

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

        if (leftButtonPressed) {

            if (sculptureMorph) {
                reset();
                collectData(event);
            }

            sculpt();
        }



    };

    var onMouseMove = function (event) {

        console.log(event.button);

        if (event.altKey || event.ctrlKey)
            return;

        if (leftButtonPressed) {//left button

            if (geometry) {

                leftCurrentPointY = event.clientY;
                sculpt();
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
    };



};


//Point to point measurer
TOOLS.Sculpturing.prototype = TOOLS; 
TOOLS.Sculpturing.prototype.constructor = TOOLS.Tool(TOOLS.SCULPTURING);
