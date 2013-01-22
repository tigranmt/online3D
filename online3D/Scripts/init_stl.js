function init() {

    //Web gl members
    this.glScene = undefined;
    this.glRenderer = undefined;
    this.glCamera = undefined;
    this.sceneTracker = undefined;
    this.stlLoader = undefined;
    this.textMesh = undefined;

    var _this = this;


    this.pointFromRay = function (event) {

        //view vector from UI coordinates
        var vector = new THREE.Vector3(
                    (event.clientX / $("#3DArea").width()) * 2 - 1,
                    -(event.clientY / window.innerHeight) * 2 + 1,
                    0.5);


        //unproject to 3D surface
        var projector = new THREE.Projector();
        projector.unprojectVector(vector, _this.glCamera);

        //construct ray
        var ray = new THREE.Ray(_this.glCamera.position,
                             vector.subSelf(_this.glCamera.position).normalize());

        //get intersecting objects
        var point = undefined;
        _this.glScene.forEachMesh(function (mesh) {

            var objects = new Array();
            objects.push(mesh);

            var intersects = ray.intersectObjects(objects, false);
            if (intersects.length > 0) {
                point = intersects[0].point;
                return point;
            }

        }, function continueIteration(mesh) {
            if (point !== undefined)
                return false;
            if (_this.isComposedMesh(mesh)) {
                return true;
            }
        });

        return point;

    }

    init.prototype.takeScreenshot = function () {
        return THREEx.Screenshot.toDataURL(_this.glRenderer);
    }

    //renders
    init.prototype.render = function () {
        _this.glRenderer.render(_this.glScene, _this.glCamera);
    }

    //requests animation frame and renders
    init.prototype.renderOnScreen = function () {
        if (_this.sceneTracker && _this.sceneTracker.object) {
            _this.sceneTracker.update();
        }
        requestAnimationFrame(_this.renderOnScreen);
        _this.render();
    }


    init.prototype.hideShowModel = function (modelName) {
        this.unlightModels();
        var breakExecution = false;
        this.glScene.forEachMesh(function (mesh) {
            if (mesh.name === modelName) {
                if (mesh.visible === undefined)
                    mesh.visible = false;
                else
                    mesh.visible = !mesh.visible;

                mesh.children[0].visible = mesh.visible;
                mesh.children[1].visible = mesh.visible;
                result = mesh.visible;
                breakExecution = true;
            }

        }, function (mesh) {
            if (breakExecution)
                return false;
            return _this.isComposedMesh(mesh);
        }
        );


        return result;
    }

    init.prototype.higlightModel = function (modelName) {

        _this.glScene.forEachMesh(function (mesh) {
            var mat = mesh.children[0].material;
            if (mesh.name !== modelName) {
                mat.opacity = 0.6;
            }
            else {
                mat.opacity = 1.0;
            }

            mat.needsUpdate = true;
        }, _this.isComposedMesh);
    }

    init.prototype.unlightModels = function (modelName) {
        _this.glScene.forEachMesh(function (mesh) {
            var mat = mesh.children[0].material;
            mat.opacity = 1.0;
            mat.needsUpdate = true;

        }, _this.isComposedMesh);

    }


    //init WebGL variables and scene
    this.initGL = function (container) {

        var HEIGHT = $(window).height();
        var WIDTH = $("#3DArea").width();

        var VIEW_ANGLE = 50, ASPECT = WIDTH / HEIGHT,
            NEAR = 0.1, FAR = 1000;

        // create a WebGL renderer, camera       
        this.glRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });



        //create PerspectiveCamera
        this.glCamera = new THREE.PerspectiveCamera(
                                VIEW_ANGLE,
                                ASPECT,
                                NEAR,
                                FAR);
        this.glCamera.updateProjectionMatrix();

        this.glScene = new THREE.Scene(); //create scene            
        this.glScene.add(this.glCamera); // add the camera to the scene


        //assign iterator function to scene
        this.glScene.forEachMesh = function (callback, canProcessCallback) {
            var childrenCount = this.__objects.length;
            for (var i = 0; i < childrenCount; i++) {
                var mesh = this.__objects[i];
                if (mesh !== undefined && (canProcessCallback === undefined ||
                                    canProcessCallback.call(this, mesh) !== false)) {
                    callback.call(this, mesh);
                }
            }
        };

        //generate renderer
        this.glRenderer.setSize(WIDTH, HEIGHT);
        this.glRenderer.domElement.id = "canvas";
        container.append(this.glRenderer.domElement); // attach the render-supplied DOM element


        $(window).resize(function () { //handle resize
            _this.glCamera.aspect = window.innerWidth / window.innerHeight;
            _this.glCamera.updateProjectionMatrix();
            _this.glRenderer.setSize(window.innerWidth, window.innerHeight);

        });

        //add to scene a new method
        this.glScene.getSceneBoundingBox = function () {

            var boundingBox = { min: new THREE.Vector3(Number.MAX_VALUE), max: new THREE.Vector3(Number.MIN_VALUE) };
            //var childrenCount = this.__objects.length;

             this.forEachMesh(function(mesh){
                var geometry = mesh.geometry;
                if (geometry === undefined)
                    return;

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
                
             })

//            for (var i = 0; i < childrenCount; i++) {
//                var mesh = this.__objects[i];             

//                if (mesh instanceof THREE.Object3D && mesh.children !== undefined &&
//                                mesh.children.length > 0)
//                    mesh = mesh.children[0];

//                if (mesh === undefined)
//                    continue;

//                var geometry = mesh.geometry;
//                if (geometry === undefined)
//                    continue;

//                geometry.computeBoundingBox();

//                var bounds = geometry.boundingBox;
//                
//                // bbox min
//                boundingBox.min.x = Math.min(bounds.min.x, boundingBox.min.x);
//                boundingBox.min.y = Math.min(bounds.min.y, boundingBox.min.y);
//                boundingBox.min.z = Math.min(bounds.min.z, boundingBox.min.z);

//                //bbox max
//                boundingBox.max.x = Math.max(bounds.max.x, boundingBox.max.x);
//                boundingBox.max.y = Math.max(bounds.max.y, boundingBox.max.y);
//                boundingBox.max.z = Math.max(bounds.max.z, boundingBox.max.z);

//            }

            return boundingBox;
        }



        //subscribe to mouse click event
        $("#3DArea").click(function (e) {
            if (e.button === 1) //middle 
            {
                var pointClicked = _this.pointFromRay(e);
                if (pointClicked !== undefined)
                    _this.sceneTracker.center = pointClicked;
            }

        });

    }


    //make DIVs, panels draggable on UI
    this.makeDivsDraggable = function () {

//        $("#basicPanel, #fileInfo, #toolsPanel").draggable({
//            containment: "parent"
//        });
    }

};


/*checks if specified mesh is a composed mesh*/
init.prototype.isComposedMesh = function (mesh) {
    return (mesh.children != undefined &&
                  mesh.children.length == 2 &&
                    mesh.children[0].geometry != undefined);
}

init.prototype.extensionIsOk = function (file) {
    return true;
}

//setups the tracking of the mouse pointer (rotating, moving... the camera)
init.prototype.setupSceneTracking = function () {
    this.sceneTracker = new THREE.OrbitControls(this.glCamera, $("#3DArea")[0]);
    this.sceneTracker.addEventListener('change', this.render);
}



//loads file information on UI
init.prototype.loadMeshesInformation = function () {

    var _count = this.glScene.__objects.length;
    var infoViewModels = new Array();
    var imIndex = 0;
    var _this = this;

    //collect all meshes information into the view array
    this.glScene.forEachMesh(function (mesh) {

        function modelInfo() {
            var self = this;
            self.visible = ko.observable(true);
            self.fileName = mesh.name;
            self.fileSize = "File size: " + mesh.filesize + " kb";
            self.faceCount = "Faces: " + mesh.facecount;
            self.vertexCount = "Vertices: " + mesh.verticescount;
            self.color = mesh.color;
            self.click = function (data) {
                self.visible(_this.hideShowModel.apply(_this, [data.fileName])); //ko observable
            };

            self.href = "#" + imIndex;

            var curindex = imIndex;

            self.setTransparencyVal = function (element, transparency) {
                element.css({ "width": transparency + "%" });
            };

            self.getModelByName = function (modelName) {
                var count = _this.glScene.__objects.length;
                for (var i = 0; i < count; i++) {
                    var mesh = _this.glScene.__objects[i];
                    if (mesh !== undefined && mesh.name === modelName)
                        return mesh;
                }
            };


            self.mouseWheel = function (event) {

                var mesh = self.getModelByName(self.fileName);
                if (mesh !== undefined) {
                    var mat = mesh.children[0].material;
                    var opacity = mat.opacity;

                    var delta = event.wheelDelta;
                    if (delta === undefined) //FIREFOX event supprt
                        delta = event.detail;


                    if (delta < 0)
                        opacity -= 0.03;
                    else
                        opacity += 0.03;

                    if (opacity < 0)
                        opaciy = 0;
                    if (opacity > 1)
                        opacity = 1;

                    mat.opacity = opacity;
                    self.updateTransparency();

                    event.preventDefault();
                }
            };

            self.seeDiv = function (target) {

                self.removeDiv(target);

                var wheelEvent = self.getCorrectWheelEventName();
                target.addEventListener(wheelEvent, self.mouseWheel, false);


                var adorner = $('<div />').appendTo('body');
                adorner.attr('id', 'adorner');
                adorner.css("position", "absolute");
                adorner.css("width", "12px");
                adorner.css("height", "12px");

                var id = target.parentElement.id;
                var offset = $("#" + id).offset();


                adorner.css("top", offset.top + 20 + "px");
                adorner.css("left", offset.left + 20 + "px");
             
                _this.createProgress('transparencyprogress', $('#adorner'));
                self.updateTransparency();
            };

            self.updateTransparency = function () {
                var mesh = self.getModelByName(self.fileName);
                if (mesh !== undefined) {
                    var mat = mesh.children[0].material;
                    var percent = mat.opacity * 100;
                    var span = $("#transparencyprogress span");
                    self.setTransparencyVal(span, percent);
                }
            };

            self.getCorrectWheelEventName = function () {

                if (document.onmousewheel !== undefined)
                    return "mousewheel";
                else
                    return "DOMMouseScroll";
            }

            self.removeDiv = function (target) {
                var wheelEvent = self.getCorrectWheelEventName();
                target.removeEventListener(wheelEvent, self.mouseWheel, false);
                var adorner = $("#adorner");
                if (adorner !== undefined)
                    adorner.remove();
            };

            self.isVisible = function () {
                return self.visible();
            };

            self.over = function (data) {
                _this.higlightModel(data.fileName);
            };

            self.imageover = function (data, event) {
                self.seeDiv(event.currentTarget);
            };

            self.imageout = function (data, event) {
                self.removeDiv(event.currentTarget);
            };


            self.out = function (data) {
                _this.unlightModels(data.fileName);
            };

            self.src = function () {
                return "/Content/Images/" + curindex + ".png";
            }

        };

        //push in view array
        infoViewModels.push(new modelInfo());
        imIndex++;
    }

    , this.isComposedMesh);

    //ctor object
    var infos = new (function (infos) {
        this.modelsInformation = infos;

    })(infoViewModels);

    var infolist = $("#infoList")[0];
    ko.applyBindings(infos, infolist); //bind to element   
}


/*Creates progress with: id(Id of the progress), parent(parent element to add to)*/
init.prototype.createProgress = function (id, parent) {

//    var inner = $('<div />').appendTo(parent);
//    inner.attr('id', id);
//    //inner.addClass("progress-bar blue stripes");
//    inner.addClass(" progress progress-striped active");   
//    inner.css({ "margin": "-6px 4px 2px -20px", "height": "5px", "width": "40px", "left": "50%", "padding": "3px" });
//    var span = $('<span />').appendTo('#' + id);
//    span.attr('id', 'progressspan');
//    span.css({ "width": "100%", "top": "-0.7em" });

    var inner = $('<div />').appendTo(parent);
    inner.attr('id', id);   
    inner.addClass(" progress progress-striped active");   
    inner.css({ "margin": "-6px 4px 2px -20px", "height": "5px", "width": "40px", "left": "50%", "padding": "3px", "position":"relative" });
    var span = $('<div />').appendTo('#' + id);
    span.attr('id', 'progressspan');
    span.attr('class', 'bar');
    span.css({ "width": "100%", "top": "-0.7em" });

    
}


init.prototype.updateProgressDiv = function(name, percent, text) {
    var div = $("#flprogress");
    var spanprogress = undefined, spantext = undefined;
    if (div.length === 0) {
        // construct div
        $("#body").append(
            "<div id='flprogress'>" +
            " " +
            "</div>"
        );
        div = $("#flprogress");

        //cinstruct progress span
        this.createProgress('flprogress_span', div);

        //set CSS on prgrss span
        $("#flprogress_span").css({ "width": "6px 0px 0px 6px", "height": "40%", "width": "90%", "left": "10%", "top": "10px", "padding": "2px" });

        spanprogress = $("#flprogress_span #progressspan");
        spanprogress.css({ "width": "1%", "top": "0.0em" });
        div.append("<span id='modelname' style='position:relative; top: 10px; left: 10px;font-weight: bold;font-size: 0.85em; color:whitesmoke'></span>");

        spantext = $("#flprogress #modelname");
        div.fadeIn(400);
    }

    if (spanprogress === undefined)
        spanprogress = $("#flprogress_span #progressspan");

    if (spantext === undefined)
        spantext = $("#flprogress #modelname");

    if (percent < 1)
        percent = 1;

    spanprogress.css({ "width": percent + "%" });   

    if (percent < 100){
        spantext.text(text);
    }
    else {
        spantext.text("Completed!");
    }
}


init.prototype.showDownloadProgress = function(name, percent) {
    this.updateProgressDiv(name, percent, "Downloading " + name + " ...");
}

init.prototype.showUploadProgress = function (name, percent) {    
    this.updateProgressDiv(name, percent, "Uploading " + name + " ...");
}

/*get trasmission vertexes packet size based on tatal vertices amount*/
init.prototype.getPacketSize = function(vertexCount) {

    if(vertexCount >=500000)
        return vertexCount / 81; 
    else if(vertexCount >=300000)
         return vertexCount/ 27; 
    else if(vertexCount >=100000)
        return vertexCount/ 81;    
    else if(vertexCount >=40000)
        return vertexCount/ 243;
    else if(vertexCount >=10000)
        return vertexCount/ 729;

    return 3;
}

/*Sends all files on the scene to the server*/
init.prototype.sendContentToServer = function () {

    var unique = undefined; //unique key associated with this scene
    var meshIndex = 0;
    var _this = this;

    //for each mesh upload
    (function uploadAnotherModel() {

        var childrenCount = _this.glScene.__objects.length;
        if (meshIndex >= childrenCount) {
            $("#flprogress").remove();
            toastr.success('Upload of all models done.', 'Success !');
            return;
        }

        var mesh = _this.glScene.__objects[meshIndex];
        if (!_this.isComposedMesh(mesh)) {
            meshIndex++;
            uploadAnotherModel();
            return;
        }

        //these variables are in closure
        var geometryMesh = mesh.children[0];
        var verticesCount = geometryMesh.geometry.vertices.length;

        var step = parseInt(_this.getPacketSize(verticesCount));
        var index = 0;


        if (index === 0) {
            _this.showUploadProgress(mesh.name, 0);

        }

        var screenShotTaken = false;

        function currentModelSequence() {

            var verticesSplit = new Array();


            while (index < verticesCount) {
                verticesSplit.push(geometryMesh.geometry.vertices[index]);
                index++;

                /*In case of first vertex in the model just push it raise ajax. So we will check for authentication requeirement,
                and no any relation with the models size, as we push ALWAYS only 1 vertex on first step for ANY model*/
                if (index == 1)
                    break;


                if (verticesSplit.length % step === 0)
                    break;
            }

            var modelInfo = {
                ModelName: mesh.name,
                Size: mesh.filesize,
                Format: "Stl",
                ID: unique,
                Vertices: verticesSplit,
                VertexCount: verticesCount,
                Color: mesh.color,
            };


            if(index === 1 && !screenShotTaken) {
                modelInfo. ModelImage =  _this.takeScreenshot();   
                screenShotTaken = true;         
            }

            $.ajax({
                url: "SaveModel/",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(modelInfo),
                //data: modelInfo,
                dataType: 'json',
                success: function (data) {
                    //get the unique key associated to this model+scene, generated by the server
                    unique = data;

                    //if I'm not at the end of the collection, call my self to go ahead
                    if (index < verticesCount) {
                        currentModelSequence();
                        _this.showUploadProgress(mesh.name, 100 / (verticesCount / index));
                    }
                    else {
                        //load another model
                        meshIndex++;
                        _this.showUploadProgress(mesh.name, 100);
                        uploadAnotherModel(); //call to upload another model in collection, if any
                    }
                },
                error: function (data) {
                    toastr.error('Error on save.', 'Error !');
                    $("#flprogress").remove();
                },
                statusCode: {
                    401: function (data) {
                        meshIndex = -1; //not valid value
                        $("#flprogress").remove();
                        toastr.error('You need to login first.', 'Error !');
                        userAccess.requestUserAuth();

                    }
                }
            });

        }; //call myself

        currentModelSequence();

    })();

}



/*This method does sequential calls untill receives the notification about an empty and/or completed queue*/
init.prototype.LoadFromServer = function (unique) {
    //make ajax request to load a session from the server

    var _this = this;
    var mindex = 0;
    var packet = 0;
    var models = new Array();

   

    var tempModel = {};
    (function load() {
        $.ajax({
            url: '../GetModels/',
            data: { id: unique, modelIndex: mindex, packetIndex: packet },
            success: function (data) {

                /*init data if it wasn't done before*/
                if (tempModel.ModelName === undefined)
                    tempModel.ModelName = data.ModelName;
                if (tempModel.Size === undefined)
                    tempModel.Size = data.Size;
                if (tempModel.Format === undefined)
                    tempModel.Format = data.Format;
                if (tempModel.Vertices === undefined)
                    tempModel.Vertices = [];
                if (tempModel.VertexCount === undefined)
                    tempModel.VertexCount = data.VertexCount;
                if (tempModel.Color === undefined)
                    tempModel.Color = data.Color;
                /**------**/


                if (data === "modeldone") {
                    models.push(tempModel);
                    mindex++;  //go to another model in chain, if any
                    packet = 0;  //packet becomes 0
                    tempModel = {}; //reset tempModel
                       
                     _this.showDownloadProgress(tempModel.ModelName, 100);
                    load(); //call myself again
                }
                else if (data !== "alldone") {
                    if(packet == 0) {
                        _this.showDownloadProgress(tempModel.ModelName, 0);
                    }
                    else{
                       _this.showDownloadProgress(tempModel.ModelName, 100 / (tempModel.VertexCount / tempModel.Vertices.length));
                    }
                     

                    tempModel.Vertices = tempModel.Vertices.concat(data.Vertices); //concatenate vertices arrived to already available ones
                    packet++;
                    load(); //call myself again
                }
                else {
                    //all done
                    $("#flprogress").remove();   
                     toastr.success('Got all models from the server. Now begin processing','Success !');
                    _this.loadMeshesFromServer(models); //load models to scene
                    models = []; //reset collection of the models

                }

            }
        });
    })();




}

init.prototype.finalizeLoading = function () {
    this.loadMeshesInformation.apply(this);
}



init.prototype.hidePanels = function () {
    $("#3DArea").css("visibility", "hidden");
    $("#toolsPanel").css("visibility", "hidden");
    $("#basicPanel").css("visibility", "hidden");
    $("#fileInfo").css("visibility", "hidden");

}

init.prototype.showPanels = function () {

    $("#3DArea").css("visibility", "visible");
    $("#toolsPanel").css("visibility", "visible");
    $("#basicPanel").css("visibility", "visible");
    $("#fileInfo").css("visibility", "visible");
}


/*look from
vector - view vector 
offset - offset to get from the vector edge
axis   -  to align to (can be not specified)
bounds bounds to align to
*/
init.prototype.lookFrom = function (vector, offset, axis, bounds) {


    if (bounds === undefined)
        bounds = this.glScene.getSceneBoundingBox();

    var center = new THREE.Vector3();
    center.x = (bounds.min.x + bounds.max.x) / 2;
    center.y = (bounds.min.y + bounds.max.y) / 2;
    center.z = (bounds.min.z + bounds.max.z) / 2;

    this.sceneTracker.center = center;

    var diag = new THREE.Vector3();
    diag = diag.sub(bounds.max, bounds.min);
    var radius = diag.length() / 2;

    // Compute offset needed to move the camera back that much needed to center AABB (approx: better if from BB front face)
    offset = radius / Math.tan(Math.PI / 180.0 * this.glCamera.fov * 0.5);


    // Compute new camera position
    var dir = vector;
    dir.multiplyScalar(offset);

    var newPos = new THREE.Vector3();
    newPos.add(center, dir);

    if (axis === "z" || axis === undefined) {
        this.glCamera.position.set(center.x, center.y, newPos.z);
      

    }
    else if (axis === "x")
        this.glCamera.position.set(newPos.x, center.y, center.z);
    else if (axis === "y")
        this.glCamera.position.set(center.x, newPos.y, center.z);

    return center;


}

/*fits the content of the scene into the camera*/
init.prototype.fitCamera = function (scene, camera, tracker, bounds) {


    var vector = camera.matrix.getColumnZ()

    var center = this.lookFrom(vector);

    var spotlight = new THREE.SpotLight(0xFFFFFF, 0.8);
    spotlight.position = camera.position;
    spotlight.target.position = center;
    scene.add(spotlight);

}


init.prototype.initScene = function (_this) {
    if (!_this.glScene)
        _this.initGL($("#3DArea"));  //init WebGL on area
    if (!_this.glScene) {
        toastr.error('Can not initialize GL engine', 'Error');
        return;
    }

    //setup mouse basic operations on scene
    _this.setupSceneTracking();

    //make tool dives visible
    _this.makeDivsDraggable();

    //init STL loader
    _this.stlLoader = new STL(this.glScene, this.glCamera, this.glRenderer, this.sceneTracker);

    _this.hidePanels();
}

/*load the sequence of files in async*/
init.prototype.LoadFiles = function (files) {

    if (files === undefined)
        return;

    var _this = this;
    _this.initScene(_this);


    var index = files.length - 1;

    //load in async way
    var loadAsync = function () {
        if (index < 0) {

            _this.fitCamera.apply(_this, [_this.glScene, _this.glCamera, _this.sceneTracker]); //fit camera on end
            _this.renderOnScreen(); //render
            _this.finalizeLoading.apply(_this);
            _this.showPanels(); //show panels
          

            toastr.success('Done !');
            return;
        }
        var store = files[index];
        _this.stlLoader.loadStlModel(store.fileData, store.fileName, store.fileSize, loadAsync);  //load models in async way  
        index--;
    };

    loadAsync();
}


init.prototype.loadMeshesFromServer = function (meshes) {

    if (meshes === undefined)
        return;

    var _this = this;
    _this.initScene(_this);
    var index = meshes.length - 1;

    

    //load in async way
    var loadAsync = function () {
        if (index < 0) {

            _this.fitCamera.apply(_this, [_this.glScene, _this.glCamera, _this.sceneTracker]); //fit camera on end
            _this.renderOnScreen(); //render
            _this.finalizeLoading.apply(_this);
            _this.showPanels(); //show panels            
            toastr.success('Done !');
            return;
        }
        var mesh = meshes[index];
        _this.stlLoader.loadMeshModel(mesh, loadAsync);  //load meshes in async way  
        index--;
    };

    loadAsync();


}


/*loads the file data*/
init.prototype.LoadFileData = function (file) {

    //get store data, pass call-back to call after async execution
    window.indexedFiles.getAllFiles(this, this.LoadFiles);
}



init.prototype.pointCloudView = function () {

    //    var meshes = this.getSelectedOrAllMeshFromScene();
    //    if(mesh === undefined || meshes.length == 0)
    //        return;


    //    var geometry = mesh.geometry;

    //    // create the particle variables
    //    var particleCount = 1800,
    //    particles = new THREE.Geometry(),
    //    pMaterial =
    //      new THREE.ParticleBasicMaterial({
    //          color: 0x000000,
    //          size: 0.4
    //      });

    //    // now create the individual particles
    //    var vertices = geometry.vertices;
    //    var count = vertices.length;
    //    for (var p = 0; p < count; p++) {

    //        var vertex = vertices[p];
    //        // add it to the geometry
    //        particles.vertices.push(new THREE.Vector3(vertex.x, vertex.y, vertex.z));
    //    }

    //    // create the particle system
    //    var particleSystem =
    //    new THREE.ParticleSystem(
    //        particles,
    //         pMaterial);

    //    this.glScene.remove(mesh);
    //    this.glScene.add(particleSystem);
    // add it to the scene
}

/*View models like mesh(solid view)*/
init.prototype.solidView = function () {

    //iterating over meshes
    this.glScene.forEachMesh(function (mesh) {
        if (!mesh.visible)
            return;

        mesh.children[0].visible = true;
        mesh.children[1].visible = false;

    }, this.isComposedMesh);
}


/*View models wireframe(triangles)*/
init.prototype.wireframeView = function () {

    this.glScene.forEachMesh(function (mesh) {
        if (!mesh.visible)
            return;

        if (!mesh.visible)
            return;

        mesh.children[0].visible = false;
        mesh.children[1].visible = true;
    }, this.isComposedMesh);


}

/*View models like mesh(solid model + wireframe)*/
init.prototype.meshView = function () {

    this.glScene.forEachMesh(function (mesh) {

        if (!mesh.visible)
            return;

        mesh.children[0].visible = true;
        mesh.children[1].visible = true;
    }, this.isComposedMesh);

}


init.prototype.showEdges = function () {
    var mesh = this.glScene.__los[0];
    var geometry = mesh.geometry;
}


/*View from the top of the scen*/
init.prototype.topView = function () {

    var vector = this.glCamera.matrix.getColumnZ();
    var offset = 1;
    vector.z = 1;
    if (vector.z < 0) {
        vector.z *= -1;
    }
    this.lookFrom(vector, offset, "z");
}


/*View from the bottom of the scen*/
init.prototype.bottomView = function () {
    var vector = this.glCamera.matrix.getColumnZ();
    var offset = 1;
    vector.z = 1;
    if (vector.z > 0) {
        vector.z *= -1;
    }
    this.lookFrom(vector, offset, "z");
}


/*View from the left of the scen*/
init.prototype.leftView = function () {
    var vector = this.glCamera.matrix.getColumnX();
    var offset = 1;
    vector.x = 1;
    if (vector.x < 0) {
        vector.x *= -1;
    }
    this.lookFrom(vector, offset, "x");
}


/*View from the right of the scen*/
init.prototype.rightView = function () {

    var vector = this.glCamera.matrix.getColumnX();
    var offset = 1;
    vector.x = 1;
    if (vector.x > 0) {
        vector.x *= -1;
    }
    this.lookFrom(vector, offset, "x");
}


/*View from the front of the scen*/
init.prototype.frontView = function () {
    var vector = this.glCamera.matrix.getColumnY();
    var offset = 1;
    vector.y = 1;
    if (vector.y > 0) {
        vector.y *= -1;
    }
    this.lookFrom(vector, offset, "y");
}


/*View from the back of the scen*/
init.prototype.backView = function () {
    var vector = this.glCamera.matrix.getColumnY();
    var offset = 1;
    vector.y = 1;
    if (vector.y < 0) {
        vector.y *= -1;
    }
    this.lookFrom(vector, offset, "y");
}

