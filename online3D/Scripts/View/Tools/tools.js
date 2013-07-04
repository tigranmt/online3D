var TOOLS = TOOLS || {

    POINT_TO_POINT_MEASURER: "Point to point Measurer",
    MESH_PENCIL: "Mesh pencil",
    NOTES_MANAGER: "Notes manager",
    SCULPTURING: "Sculpturing",
    SELECTION: "Selection",


    toolsarray: {},

    selectionColor : "#00FF00",

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
        else if (toolName === this.SCULPTURING)
            return new this.Sculpturing();
        else if (toolName === this.SELECTION)
            return new this.SelectionManager();
    },



    addMesh: function (mesh) {
        this.scene.add(mesh);
    },

    removeMesh: function (mesh) {
        this.scene.remove(mesh);
    },



    unproject: function (direction) {

        //unproject to 3D surface
        var projector = new THREE.Projector();
        return projector.unprojectVector(direction, this.camera);
    },

    getTopViewDirection: function (event) {


        var x = (event.clientX / window.innerWidth) * 2 - 1;
        var navbar = $("#navbar");
        var navbarheight = navbar ? navbar.height() : 0;
        var y = -((event.clientY - navbarheight) / window.innerHeight) * 2 + 1;



        var viewDirection = new THREE.Vector3();
        viewDirection.set(x, y, 1);
        return this.unproject(viewDirection);

    },

    getViewDirection: function (event) {

        var topView = this.getTopViewDirection(event);

        // Substract the vector representing the camera position
        var sub = topView.subVectors(topView, this.camera.position);
        return sub;

    },

    getCameraPosition: function () {
        return this.camera.position;
    },



    unprojectMouse: function (event) {
        var navbar = $("#navbar");
        var navbarheight = navbar ? navbar.height() : 0;
        var vector = new THREE.Vector3((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / (window.innerHeight + navbarheight)) * 2 + 1, 0.5);
        var projector = new THREE.Projector();
        projector.unprojectVector(vector, this.camera);
        return vector;
    },

    getIntersectionFromMouseCoord: function (event) {
       // var viewDirection = this.getViewDirection(event);


        //get all meshes from scene
        var objects = [];
        this.forEachMesh(function (mesh) {
            if (mesh.visible) {
                objects.push(mesh.children[0]);
            }
        });

        var x = (event.clientX / window.innerWidth) * 2 - 1;
        var navbar = $("#navbar");
        var navbarheight = navbar ? navbar.height() : 0;
        var y = -((event.clientY - navbarheight) / window.innerHeight) * 2 + 1;


        var projector = new THREE.Projector();
        var ray = projector.pickingRay(new THREE.Vector3(x, y, 0), this.camera);
        intersects = ray.intersectObjects(objects);
        if (intersects.length > 0) {
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
        return (mesh && mesh.children &&
                  mesh.children.length == 2 &&
                    mesh.children[0].geometry);
    },

    selectFaces: function (faces) {
        for (var f = 0; f < faces.length; f++) {
            var face = faces[f];

            //if face is already selected
            if (face.color.r == 0 && face.color.g === 1 && face.color.r === 0)
                continue;

            //---
            if (face.color instanceof THREE.Color) {
                face.originalColor = new THREE.Color().copy(face.color);
            }
            else {
                face.originalColor = face.color;
            }

            this.setColorOnFace(undefined, face, this.selectionColor, true);
        }

    },


    clearSelection: function () {
        this.forEachMesh(function (mesh) {
            var geo = mesh.children[0].geometry;
            var faces = geo.faces;
            for (var f = 0; f < faces.length; f++) {
                var face = faces[f];
                if (face.originalColor !== undefined) {
                    if (face.originalColor instanceof THREE.Color) {
                        face.color = new THREE.Color().copy(face.originalColor);
                    }
                    else {
                        face.color = face.originalColor;
                    }                  
                }
            }
          
            geo.colorsNeedUpdate = true;
        
        },
   function (mesh) {
       return this.isComposedMesh(mesh);
   });

    },


    updateAllGeometries : function(updateColors, updateVertices) {
      this.forEachMesh(function (mesh) {
          var geo = mesh.children[0].geometry;

          if(updateColors) {
              geo.colorsNeedUpdate = true;
          }

          if (updateVertices) {
              geo.verticesNeedUpdate = true;
          }
      },
      function (mesh) {
          return this.isComposedMesh(mesh);
      });
    },


    setColorOnFace: function (geometry, face, color, onlyface) {

        face.color.set(color);

        /*do not need coloring of the vertices*/
        if (onlyface === true)
            return;

        geometry.vertices[face.a].vertexColor = color;
        geometry.vertices[face.b].vertexColor = color;
        geometry.vertices[face.c].vertexColor = color;

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

                var meshes = [];
                var mo = this.scene.__objects[i];
                if (mo.Format === "obj") {
                    meshes = mo.children.slice(0);
                }
                else {
                    meshes.push(mo);
                }
                if (next === undefined)
                    next = this.isComposedMesh;

                for (var m = 0; m < meshes.length; m++) {
                    var obj = meshes[m];
                    if (obj !== undefined && next.call(this, obj) !== false) {
                        callback.call(this, obj);
                    }
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



