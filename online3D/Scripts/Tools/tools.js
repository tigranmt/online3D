﻿var TOOLS = TOOLS || {
    POINT_TO_POINT_MEASURER: "Point to point Measurer",

    toolsarray: {},

    startTool: function (toolname) {

        if (this.current !== undefined)
            this.current.stop();

        var _t = this.toolsarray[toolname];
        if (_t === undefined) {
            _t = this.toolFromName(toolname);
            this.toolsarray[toolname] = _t;
        }

        _t.start();
    },

    stoptool: function (toolname) {
        var _t = toolsarray[toolname];
        if (_t !== undefined) {
            _t.stop();
        }
    },

    toolFromName: function (toolName) {
        if (toolName === this.POINT_TO_POINT_MEASURER)
            return new this.PointToPointMeasurer();
    },



    addMesh: function (mesh) {
        this.scene.add(mesh);
    },

    removeMesh: function (mesh) {
        this.scene.remove(mesh);
    },


    //get THREE.Vector3 object from mouse coordinate
    getVertexFromMouseCoord: function (event) {


        var x = (event.clientX / window.innerWidth) * 2 - 1;
        var navbar = $("#navbar");
        var navbarheight = navbar ? navbar.height() : 0;
        var y = -((event.clientY - navbarheight) / window.innerHeight) * 2 + 1;


        var cameraPosition = this.camera.position;
        var viewDirection = new THREE.Vector3();
        viewDirection.set(x, y, 1);

        //unproject to 3D surface
        var projector = new THREE.Projector();
        projector.unprojectVector(viewDirection, this.camera);

        // Substract the vector representing the camera position
        viewDirection = viewDirection.subVectors(viewDirection, cameraPosition);

        //get all meshes from scene
        var objects = [];
        this.forEachMesh(function (mesh) {
            objects.push(mesh.children[0]);
        });


        viewDirection.normalize();


        var raycaster = new THREE.Raycaster(cameraPosition, viewDirection);
        var intersects = raycaster.intersectObjects(objects);
        var point = new THREE.Vector3();

        if (intersects.length > 0) {
            point = intersects[0].point;
            return point;
        }

    },

    isComposedMesh: function (mesh) {
        return (mesh.children != undefined &&
                  mesh.children.length == 2 &&
                    mesh.children[0].geometry != undefined);
    },

    //add to scene a new method
    getSceneBoundingBox: function () {

        var boundingBox = { min: new THREE.Vector3(Number.MAX_VALUE), max: new THREE.Vector3(Number.MIN_VALUE) };
        //var childrenCount = this.__objects.length;

        this.forEachMesh(function (mesh) {
            var geometry = mesh.geometry;
            if (geometry === undefined && mesh.children.length > 0)
                geometry = mesh.children[0].geometry;

            if (geometry === undefined) {
                console.log("No geometry for mesh found");
                return;
            }

            geometry.computeBoundingBox();

            var bounds = geometry.boundingBox;

            // bbox min
            boundingBox.min.x = Math.min(bounds.min.x, boundingBox.min.x);
            boundingBox.min.y = Math.min(bounds.min.y, boundingBox.min.y);
            boundingBox.min.z = Math.min(bounds.min.z, boundingBox.min.z);

            //bbox max
            boundingBox.max.x = Math.max(bounds.max.x, boundingBox.max.x);
            boundingBox.max.y = Math.max(bounds.max.y, boundingBox.max.y);
            boundingBox.max.z = Math.max(bounds.max.z, boundingBox.max.z);

        });


        return boundingBox;
    },

    attach: function (scene3D, camera3D) {
        this.scene = scene3D;
        this.camera = camera3D;

        //assign iterator function to scene
        this.forEachMesh = function (callback, next) {
            var childrenCount = this.scene.__objects.length;
            for (var i = 0; i < childrenCount; i++) {

                var mesh = this.scene.__objects[i];
                if (next === undefined)
                    next = this.isComposedMesh;

                if (mesh !== undefined && next.call(this, mesh) !== false) {
                    callback.call(this, mesh);
                }
            }
        };
    }
};


//Base Tool object
TOOLS.Tool = function(toolname) {
    this.name =  toolname; 
};




TOOLS.PointToPointMeasurer = function () {



    this.start = function () {
        console.log("Start point to point measurer");

        //subscribe to mouse click and mousemove event for drawing 
        document.addEventListener('mousemove', onMouseMove, false);
        document.addEventListener('mouseup', onMouseUp, false);

        TOOLS.current = this;
    };

    this.stop = function () {
        console.log("Stop point to point measurer");

        //remove event listeners
        document.removeEventListener('mousemove', onMouseMove, false);
        document.removeEventListener('mouseup', onMouseUp, false);

        TOOLS.current = undefined;
    };

    var createVertex = function (vertex) {
        var sphereGeometry = new THREE.SphereGeometry(50, 32, 16);
        var sphereMaterial = new THREE.MeshLambertMaterial({ color: 0x1818ff });
        var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(vertex);
        TOOLS.addMesh(sphere);

        return sphere;
    };

    var addPointFromMouse = function (event) {
        var vertex = TOOLS.getVertexFromMouseCoord(event);
        if (vertex !== undefined) {
            return createVertex(vertex);
        }
    };

    var removePoints = function () {
        TOOLS.removeMesh(this.startPoint);
        TOOLS.removeMesh(this.endPoint);

        this.startPoint = undefined;
        this.endPoint = undefined;
    };

    this.cleanPoints = function () {
        removePoints();
    };

    var drawLine = function (start, point) {
    };





    var onMouseMove = function (event) {
        if (this.startPoint != undefined && this.endPoint != undefined) {
            //Draw distance text
        }
    };

    var onMouseUp = function (event) {
        if (this.startPoint === undefined) {
            this.startPoint = addPointFromMouse(event);
        }
        else if (this.endPoint === undefined) {
            this.endPoint = addPointFromMouse(event);

            if(this.endPoint!== undefined)
                drawLine(this.startPoint, this.endPoint);
        }
    };
}



//Point to point measurer
TOOLS.PointToPointMeasurer.prototype = {

    constructor: TOOLS.Tool(TOOLS.POINT_TO_POINT_MEASURER)
};