
TOOLS.PointToPointMeasurer = function () {

    var _this = this;
    
    this.title = "Measure distance";
    this.text = "Measure distance between 2 points.";
    this.htmlUI = "<h2 id='distanceInfo' style='color:rgb(139, 85, 197)'>Distance: 0.0mm</h2>";
    this.uiWidth = 400;

    this.start = function () {
        console.log("Start point to point measurer");

        document.addEventListener('mousewheel', onMouseWheel, false);
        document.addEventListener('mouseup', onMouseUp, false);

        TOOLS.current = _this;
       
    };

    this.startAgent = function () {
        console.log("No agent call for " + this.title + " expected");
    };

    this.stop = function () {
        console.log("Stop point to point measurer");

        _this.clean();
      
        document.removeEventListener('mousewheel', onMouseWheel, false);
        document.removeEventListener('mouseup', onMouseUp, false);
        TOOLS.current = undefined;
    };

    var getPointScale = function(event, vertex) {
       
        var bounds = TOOLS.getSceneBoundingBox();

        var max = Math.max(bounds.max.x, bounds.max.y);
        max = Math.max(max, bounds.max.z);

        return (max/60);
    };

    var createVertex = function (event, vertex, vertexColor) {
        if (vertexColor === undefined)
            vertexColor = '#221111';
        var sphereGeometry = new THREE.SphereGeometry(0.2);
        var sphereMaterial = new THREE.MeshLambertMaterial({ color: vertexColor });
        var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position = vertex;
       
        var scale = getPointScale(event, vertex);
        scale = Math.max(0.3, scale);

        console.log("Scale value: " + scale);
        
        sphere.scale = new THREE.Vector3(scale,scale, scale);
        TOOLS.addMesh(sphere);

        return sphere;
    };

    var addPointFromMouse = function (event, color) {
        var vertex = TOOLS.getVertexFromMouseCoord(event);
        if (vertex !== undefined) {
            return createVertex(event, vertex, color);
        }
    };

    var removePoints = function () {
        TOOLS.removeMesh(_this.startPoint);
        TOOLS.removeMesh(_this.endPoint);

        _this.startPoint = undefined;
        _this.endPoint = undefined;
    };

    var removeLine = function() {
        if(_this.line !== undefined){
           TOOLS.removeMesh(_this.line);
           _this.line = undefined;
        }
    };

    this.clean = function () {
        removePoints();
        removeLine();
    };



    var drawLine = function (start, end) {

        var line = new THREE.Geometry();
        line.vertices.push(start.position);
        line.vertices.push(end.position);
        var material = new THREE.LineBasicMaterial({
            color: 0x0000ff,
        });

        _this.line = new THREE.Line(line, material);
        TOOLS.addMesh(_this.line);

    };


    var onMouseWheel = function(event) {
        if(_this.startPoint !== undefined) {
            var startScale = getPointScale(event, _this.startPoint.position);
            _this.startPoint.scale = new THREE.Vector3(startScale, startScale,startScale);
        }

         if(_this.endPoint !== undefined) {
            var endScale = getPointScale(event, _this.endPoint.position);
            _this.endPoint.scale = new THREE.Vector3(endScale, endScale,endScale);
        }
            
    };

    var onMouseUp = function (event) {

        //if not a LEFT button, return
        if (event.button !== 0 || event.ctrlKey || event.shiftKey)
            return;

        if(_this.startPoint !== undefined && _this.endPoint !== undefined) {
            _this.clean();
        }

        if (_this.startPoint === undefined) {
            _this.startPoint = addPointFromMouse(event, '#EE33EE');
        }
        else if (_this.endPoint === undefined) {
            _this.endPoint = addPointFromMouse(event, '#AA33AA');            
            if (_this.endPoint !== undefined) {
                drawLine(_this.startPoint, _this.endPoint);
                
                var distance = _this.startPoint.position.distanceTo(_this.endPoint.position);
                //round to #.00
                distance = Math.round(distance * 100) / 100; 

                var distanceUI = $("#distanceInfo");
                if(distanceUI !== undefined) 
                    distanceUI.text("Distance: " + distance + " mm");
            }
        }
    };
}



//Point to point measurer
TOOLS.PointToPointMeasurer.prototype = TOOLS; 
TOOLS.PointToPointMeasurer.prototype.constructor = TOOLS.Tool(TOOLS.POINT_TO_POINT_MEASURER);
