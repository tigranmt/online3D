TOOLS.SelectionManager = function () {


    var _this = this;
    var regionSelectionStarted = false;

    var lastSegmentMesh;
    var region = [];

    this.start = function () {
        console.log("No agent call for " + this.title + " expected");
    };

    this.startAgent = function () {
        console.log("Start " + this.title + " agent");

        lastAddedNotePoint = undefined;
       
        document.addEventListener('mouseup', onMouseUp, false);
        document.addEventListener('mousemove', onMouseMove, false);
    };


    this.stopAgent = function () {
        console.log("No stop call for " + this.title + " expected");

        document.removeEventListener('mouseup', onMouseUp, false);
        document.removeEventListener('mousemove', onMouseMove, false);

    };

    this.stop = function () {
        console.log("No stop call for " + this.title + " expected");
    };


    var surfaceSelection = function (face) {

    }

    var getCursorPosition3D = function (e) {
        return TOOLS.unprojectMouse(e);
    }
  
    var  getCursorPosition = function(e) {
        var x;
        var y;

        if (e.pageX != undefined && e.pageY != undefined) {
            x = e.pageX;
            y = e.pageY;
        } else {
            x = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
            y = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
        }

        return { xcoord: x, ycoord: y };
    }


    var resetCurrentDrawing = function () {
        region = [];
        TOOLS.removeMesh(lastSegmentMesh);
        regionSelectionStarted = false;

        //remove all previously added lines of region 
        var remove = [];
        TOOLS.forEachMesh(function (m) {
            remove.push(m);
        },
        function (m) {
            return m.region !== undefined;
        });

        for (var i = 0; i < remove.length; i++) {
            TOOLS.removeMesh(remove[i]);
        }
    }


    var isInsidePath = function (pointX, pointY, path) {
        
        var isInside = false;
        var pointsCount = path.length;

        var j = 0;
        for (var i = 0; i < pointsCount; i++)
        {
            j++;
            if (j == pointsCount)
                j = 0;

            if (path[i].y < pointY && path[j].y >= pointY || path[j].y < pointY && path[i].y >= pointY)
            {
                if (path[i].x + (pointY - path[i].y) / (path[j].y - path[i].y) * (path[j].x - path[i].x) < pointX)
                {
                    isInside = !isInside;
                }
            }
        }

        return isInside;
    }

    var getProjectedPoint = function (plane, start, direction) {

        var end = new THREE.Vector3(start.x, start.y, start.z); 
        end.addVectors(end, direction);

        return plane.intersectLine(start, end);
    }

  
    var drawTestLine = function (v0, v1, color) {


        var c = color || "#000000";

        var material = new THREE.LineBasicMaterial({
            color: c
        });


        var geo = new THREE.Geometry();
        geo.vertices.push(v0);
        geo.vertices.push(v1);

        TOOLS.addMesh(new THREE.Line(geo, material));
    }

    var makeSelection = function (event, region) {
        var suitableForSelection = [];
        
        //var vectorView = TOOLS.getViewDirection(event);
        //vectorView.normalize();
       
        var plane = new THREE.Plane();
        // plane.setFromNormalAndCoplanarPoint(vectorView, region[0]);
        plane.setFromCoplanarPoints(region[0], region[1], region[2]);

        var cameraPosition = TOOLS.getCameraPosition();

        drawTestLine(cameraPosition, plane.normal);
      

        //TEST CODE
        //var p = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshNormalMaterial());
        //p.overdraw = true;
        //TOOLS.addMesh(p);

        //var angle = new THREE.Vector3(0, 0, 1).angleTo(plane.normal);
        //p.rotation.set(angle, angle, angle);

        //return; 

        var geometries = [];
        var progectedRegion = [];
        for (var g = 0; g < region.length; g++) {
            var pro = plane.projectPoint(region[g]);
            progectedRegion.push(pro);
        }
     
        for (var a = 0; a < progectedRegion.length; a++) {
            var next = a + 1;
            if (next == region.length)
                next = 0;
            drawTestLine(progectedRegion[a], progectedRegion[next], "#FF0000");
        }

        TOOLS.forEachMesh(function (mesh) {
            var geo = mesh.children[0].geometry;
            var faces = geo.faces;
            var vertices = geo.vertices;
            var geometryNeedsUpdates = false; 
            for (var i = 0; i < faces.length; i++) {
                var face = faces[i];

                var vertexa = vertices[face.a];
                var vertexb = vertices[face.b];
                var vertexc = vertices[face.c];

                var vertexaP = plane.projectPoint(vertexa);
                var vertexbP = plane.projectPoint(vertexb);
                var vertexcP = plane.projectPoint(vertexc);
    

                drawTestLine(vertexaP, cameraPosition);

                //var vertexaP = getProjectedPoint(plane, vertexa, vectorView);
                //var vertexbP = getProjectedPoint(plane, vertexb, vectorView);
                //var vertexcP = getProjectedPoint(plane, vertexc, vectorView);

            
                var aInside = isInsidePath(vertexaP.x, vertexaP.y, region);
                var bInside = isInsidePath(vertexbP.x, vertexbP.y, region);
                var cInside = isInsidePath(vertexcP.x, vertexcP.y, region);

                if (aInside && bInside && cInside) {
                    suitableForSelection.push(face);
                    geometryNeedsUpdates = true;
                }
            }

            if (geometryNeedsUpdates) {
                geometries.push(geo);
            }
            
        },
        function (mesh) {
            return TOOLS.isComposedMesh(mesh);
        });

        TOOLS.selectFaces(suitableForSelection);
        for (var g = 0; g < geometries.length; g++) {
            var geo = geometries[g];
            geo.colorsNeedUpdate = true;
        }

    }

    var isRegionClosed = function (region) {
        if (region.length < 2)
            return false;

        var lastPoint = region[region.length - 1];
        var firstPoint = region[0];

        return (lastPoint.distanceTo(firstPoint) < 0.05);

    }
   
    var drawSegment = function (v0, v1) {

        var material = new THREE.LineBasicMaterial({
            color: 0x0000ff
        });


        var geo = new THREE.Geometry();
        geo.vertices.push(v0);
        geo.vertices.push(v1);

        var line = new THREE.Line(geo, material);
        line.region = true;
        TOOLS.addMesh(line); 

        return line;
    }

    var drawLastSegment = function (event) {
        TOOLS.removeMesh(lastSegmentMesh);

        var curPos = getCursorPosition3D(event);      
        var lastPos= region[region.length - 1]; 

        lastSegmentMesh = drawSegment(lastPos, curPos);
    }

    var onMouseUp = function (event) {

        if (event === undefined) return;

        return;
        
       
        //if there is another tool in execution or is not LEFT button pressed, do not do anything 
        if (event.button !== 0 || TOOLS.current !== undefined) {
            resetCurrentDrawing();
            return;
        };

    

        var intersection = TOOLS.getIntersectionFromMouseCoord(event);

        //there is an intersection so make a surface selection 
        if (intersection !== undefined) {

            regionSelectionStarted = false;
            surfaceSelection(intersection.face);
        }
        else {
            regionSelectionStarted = true;
            var pos = getCursorPosition3D(event);
            //conitnue constructing region
            region.push(pos);

            //region was closed 
            if (isRegionClosed(region)) {
                makeSelection(event, region);
                resetCurrentDrawing();
            }
            else {              

                //there is more then one point, so accpet last available segment as a part of region
                if (region.length > 1) {
                    //accept last availble segment 
                    drawSegment(region[region.length - 2], region[region.length - 1]);
                }
            }
        }
    };

    var onMouseMove = function (event) {
        if (event === undefined) return;
        if (event.button !== 0) return;        
        if (!regionSelectionStarted) return;
        if (event.altKey || event.ctrlKey || event.shiftKey) return;
        

        drawLastSegment(event);
    };

}


//Notes manager
TOOLS.SelectionManager.prototype = TOOLS;
TOOLS.SelectionManager.prototype.constructor = TOOLS.Tool(TOOLS.SELECTION);