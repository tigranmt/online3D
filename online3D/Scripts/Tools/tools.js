var TOOLS = TOOLS || {

    POINT_TO_POINT_MEASURER: "Point to point Measurer",
    MESH_PENCIL: "Mesh pencil",
    NOTES_MANAGER: "Notes manager",

    toolsarray: {},

    createUiForTool: function (tool) {
        $('body').append('<div id="divToolInfo" class="modal" style="left:25em; width:' + tool.uiWidth + 'px;box-shadow: 0 0 50px 0 #bbb;background: url(Images/bg.png) repeat  left;">' +
                             '<div class="modal-header">' +
                                '<button id="closebutton" type="button" class="btn-danger" style="position:absolute;left:' + (tool.uiWidth - 40) + 'px;" data-dismiss="modal" aria-hidden="true">&times;</button>' +
                                '<h3>' + tool.title + '</h3>' +
                             '</div>' +
                             '<div class="modal-body">' +
                                '<p>' + tool.text + '</p>' +
                             '</div>' +
                             '<div class="modal-body">' +
                                tool.htmlUI + //inject tool related html
                             '</div>' +
                        '</div>');

        //on close button click stops current tool and removes the tool div
        $("#closebutton").click(function (event) {
            TOOLS.stopCurrentTool();
        });
    },

    //starts sepcified tool like an agent
    startAgent: function (agentName) {
        var _t = this.toolsarray[agentName];
        if (_t === undefined) {
            _t = this.toolFromName(agentName);
            this.toolsarray[agentName] = _t;
        }

        //NO UI for agents expected

        _t.startAgent();
        return _t;

    },

    stopAgent: function (agentName) {
        this.toolsarray[agentName].stopAgent();
    },

    startTool: function (toolname) {

        if (this.current !== undefined)
            this.stopCurrentTool();

        var _t = this.toolsarray[toolname];
        if (_t === undefined) {
            _t = this.toolFromName(toolname);
            this.toolsarray[toolname] = _t;
        }

        this.createUiForTool(_t);
        _t.start();

        return _t;
    },

    stopCurrentTool: function () {

        if (TOOLS.current !== undefined) {
            TOOLS.current.stop();
            TOOLS.current = undefined;
        }

        $("#divToolInfo").remove();
    },

    toolFromName: function (toolName) {
        if (toolName === this.POINT_TO_POINT_MEASURER)
            return new this.PointToPointMeasurer();
        else if (toolName === this.MESH_PENCIL)
            return new this.MeshPencil();
        else if (toolName === this.NOTES_MANAGER)
            return new this.NotesManager();
    },



    addMesh: function (mesh) {
        this.scene.add(mesh);
    },

    removeMesh: function (mesh) {
        this.scene.remove(mesh);
    },

  
    getViewDirection: function (event) {

        var x = (event.clientX / window.innerWidth) * 2 - 1;
        var navbar = $("#navbar");
        var navbarheight = navbar ? navbar.height() : 0;
        var y = -((event.clientY - navbarheight) / window.innerHeight) * 2 + 1;



        var viewDirection = new THREE.Vector3();
        viewDirection.set(x, y, 1);

        //unproject to 3D surface
        var projector = new THREE.Projector();
        projector.unprojectVector(viewDirection, this.camera);

        return viewDirection;
    },

    getIntersectionFromMouseCoord: function (event) {
        var viewDirection = this.getViewDirection(event);
        var cameraPosition = this.camera.position;

        // Substract the vector representing the camera position
        viewDirection = viewDirection.subVectors(viewDirection, cameraPosition);

        //get all meshes from scene
        var objects = [];
        this.forEachMesh(function (mesh) {
            if (mesh.visible) {
                objects.push(mesh.children[0]);
            }
        });


        viewDirection.normalize();


        var raycaster = new THREE.Raycaster(cameraPosition, viewDirection);
        var intersects = raycaster.intersectObjects(objects);
        var point = new THREE.Vector3();

        if (intersects.length > 0) {
            //just return the first one
            return intersects[0];
        }
    },

    //get THREE.Vector3 object from mouse coordinate
    getVertexFromMouseCoord: function (event) {

        var inter = this.getIntersectionFromMouseCoord(event);
        if (inter !== undefined)
            return inter.point;
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

    attach: function (scene3D, camera3D, tracker3D) {
        this.scene = scene3D;
        this.camera = camera3D;
        this.tracker = tracker3D;

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


        this.findFirst = function (callback) {
            var childrenCount = this.scene.__objects.length;
            for (var i = 0; i < childrenCount; i++) {

                var mesh = this.scene.__objects[i];
                if (mesh !== undefined && callback.call(this, mesh) !== false) {
                    return mesh;
                }
            }
        };
    }
};


//Base Tool object
TOOLS.Tool = function(toolname) {
    this.name =  toolname; 
};



