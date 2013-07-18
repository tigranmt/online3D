function init() {

   
    this.glScene = undefined;
    this.glRenderer = undefined;
    this.glCamera = undefined;
    this.sceneTracker = undefined;
    this.modelLoader = undefined;
    this.textMesh = undefined;
    

    var _this = this;


    /* Saves the content of the scene (no matters the mesh visibility) 
     *  into JSON formatted session file xxxxx.online3D
    */
    init.prototype.saveSceneAsSession = function () {


        var _this = this;

        var onOkCallback = function (sessionName, emails) {

            //no emails support for now
            var sessionManifest = sessionInformation.getSessionManifest(sessionName, userAccess.getSignedUserName(), "", utils.getCurrentDateTime());
            sessionManifest.Notes = notesmodel.getNotesArray(); //assign notes array
            
            
            //request session name
            TOOLS.forEachMesh(function (mesh) {               
                 var meshModel = utils.meshModelFromMesh(mesh);
                 sessionManifest.Meshes.push(meshModel);
            },

            function (mesh) {
                return TOOLS.isComposedMesh(mesh);
            });



            //convert to json
            var json = JSON.stringify(sessionManifest);

            //create converter 
            var converter = new ToAsciiBlob();

            //create blob from the mesh
            var blob = converter.stringToAscciBlob(json);


            //save blob as a file 
            window.saveAs(blob, sessionManifest.SessionName + "." + window.APP_NAME);
            
        } //onOKCallback


        _this.showSessionModal(onOkCallback);      
    }

    
    /* Saves all meshes present and _visible_ on the screen into the separate files
    * */
    init.prototype.saveSceneAs = function () {

        TOOLS.forEachMesh(function (mesh) {
                if (mesh.visible) {
                    _this.saveMeshAs(mesh.children[0], mesh.name);
                }
            },
            function (mesh) {            
                return TOOLS.isComposedMesh(mesh);
            }
        );
 


    }

    /*
     * Save specified mesh to a file
     @param {THREE.Mesh} mesh Mesh object 
     @param {string} filename Name of the file to save to 

    */
    init.prototype.saveMeshAs = function (mesh, filename)
    {

        //create converter 
        var converter = new ToAsciiBlob();

        //create blob from the mesh
        var blob = converter.meshToAsciiBlob(mesh);

        if (filename === undefined)
            filename = mesh.name;

        //save blob as a file 
        window.saveAs(blob, filename);
    }
   
    /*Takes the screen shot of entire scene intot a single image 
    * @param {bool} showInWindow If True, image will be shown in seprated popup, otherwise only return base64 string
    */
    init.prototype.takeScreenshot = function (showInWindow, width, height, ready) {


        var originalimage = THREEx.Screenshot.toDataURL(_this.glRenderer);
       
        var screenshot;
        if (showInWindow === true) {
            //create preview window
            jQuery('<div/>', {
                id: 'screenshot',
                class: 'modal hide fade gridbody'
            }).appendTo($("#body"));        

       
            screenshot = $("#screenshot");
        }

        //custom width and height request
        if (width && height) {
            var callback = function (newimage) {
                if (showInWindow === true) {
                      
                    //assign RESIZED image
                    screenshot.html("<img src='" + newimage + "'></img>");                        
                       
                }

                if (ready)
                    ready(newimage);
            }

            //This is ASYNC call!
            THREEx.Screenshot.resize(originalimage, width, height, callback);
        }
        else {

            if (showInWindow === true) {
                //NO custom width and height request, so capture ENTIRE screen               
                screenshot.html("<img src='" + originalimage + "'></img>");
            }
        }

        if (showInWindow === true) {
            //subscribe to its close, so after remove accrodion
            screenshot.on('hidden', function () {
                screenshot.remove();
            });

            screenshot.modal();
        }

        return originalimage;       

    }

    //renders
    init.prototype.render = function () {
        _this.pointlight.position.copy(_this.glCamera.position);
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
        TOOLS.forEachMesh(function (mesh) {
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
            return TOOLS.isComposedMesh(mesh);
        }
        );


        return result;
    }

    init.prototype.higlightModel = function (modelName) {

        TOOLS.forEachMesh(function (mesh) {
            var mat = mesh.children[0].material;
            if (mesh.name !== modelName) {
                mat.opacity = 0.6;
            }
            else {
                mat.opacity = 1.0;
            }

            mat.needsUpdate = true;
        });
    }

    init.prototype.unlightModels = function (modelName) {
        TOOLS.forEachMesh(function (mesh) {
            var mat = mesh.children[0].material;
            mat.opacity = 1.0;
            mat.needsUpdate = true;

        });

    }


    var extendMatrix4 = function () {

        THREE.Matrix4.prototype.getColumnX = function() {
            
            var te = this.elements;
            return new THREE.Vector3(te[0], te[1], te[2]);
        };


        THREE.Matrix4.prototype.getColumnY = function () {

            var te = this.elements;
            return new THREE.Vector3(te[4], te[5], te[6]);
        };


        THREE.Matrix4.prototype.getColumnZ = function () {

            var te = this.elements;
            return new THREE.Vector3(te[8], te[9], te[10]);
        };

    }
    


    //init WebGL variables and scene
    this.initGL = function (container) {

        var HEIGHT = $(window).height();
        var WIDTH = $("#3DArea").width();

        var VIEW_ANGLE = 50, ASPECT = WIDTH / HEIGHT,
            NEAR = 0.1, FAR = 1000;


        extendMatrix4();

        // create a WebGL renderer, camera       
        this.glRenderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });


        //  this.glCamera = new THREE.OrthographicCamera(0, WIDTH, 0, 100, -100, 100);
        this.glCamera = new THREE.CombinedCamera(WIDTH, HEIGHT, VIEW_ANGLE, NEAR, FAR, NEAR, 3*FAR);
        //  this.glCamera.toOrthographic();

        // create PerspectiveCamera
        //        this.glCamera = new THREE.PerspectiveCamera(
        //                                VIEW_ANGLE,
        //                                ASPECT,
        //                                NEAR,
        //                                FAR);


        //this.glCamera.updateProjectionMatrix();

        this.glScene = new THREE.Scene(); //create scene            
        this.glScene.add(this.glCamera); // add the camera to the scene




        //generate renderer
        this.glRenderer.setSize(WIDTH, HEIGHT);
        this.glRenderer.domElement.id = "canvas";
        container.append(this.glRenderer.domElement); // attach the render-supplied DOM element

        $("#3DArea #canvas").css("position", "absolute");
        $("#3DArea #canvas").css("z-index", "2");
        $("#3DArea #canvas").css("top", "45px");



        $(window).resize(function () { //handle resize
            if (_this.glCamera instanceof THREE.CombinedCamera) {
                _this.glCamera.cameraP.aspect = window.innerWidth / window.innerHeight;
            }
            else {
                _this.glCamera.aspect = window.innerWidth / window.innerHeight;
            }

            _this.glCamera.updateProjectionMatrix();
            _this.glRenderer.setSize(window.innerWidth, window.innerHeight);

        });



        //subscribe to mouse click event
        $("#3DArea").click(function (e) {
            if (e.button === 0 && e.ctrlKey) //middle 
            {
                var pointClicked = TOOLS.getVertexFromMouseCoord(e);
                if (pointClicked !== undefined) {

                    _this.sceneTracker.target = pointClicked;
                    _this.pointlight.position = _this.glCamera.position;
                }
            }

        });

        _this.selector = TOOLS.startAgent(TOOLS.SELECTION);



    }


};


/*checks if specified mesh is a composed mesh*/


init.prototype.extensionIsOk = function (file) {
    return true;
}

//setups the tracking of the mouse pointer (rotating, moving... the camera)
init.prototype.setupSceneTracking = function () {
    //this.sceneTracker = new THREE.OrbitControls(this.glCamera, $("#3DArea")[0]);
    this.sceneTracker = new THREE.TrackballControls(this.glCamera, $("#3DArea")[0]);
   // this.sceneTracker.addEventListener('change', this.render);

    TOOLS.attach(this.glScene, this.glCamera, this.sceneTracker);
}



//loads file information on UI
init.prototype.loadMeshesInformation = function () {

    var _count = this.glScene.__objects.length;
   
    var imIndex = 0;
    var _this = this;

    viewmodels.modelsInformation.removeAll(); //reset ko.observableArray array

    //collect all meshes information into the view array
    TOOLS.forEachMesh(function (mesh) {

        function modelInfo() {
            var self = this;
            self.visible = ko.observable(true);
            if(mesh.name.length > 25)
                self.alias = mesh.name.substring(0,23) + "...";
            else {
                self.alias = mesh.name;               
            }
            self.fileName = mesh.name;
            self.fileSize = "File size: " + mesh.filesize + " kb";
            self.faceCount = "Faces: " + mesh.facecount;
            self.vertexCount = "Vertices: " + mesh.verticescount;
            self.color = mesh.color;
            self.click = function (data,event) {
                self.visible(_this.hideShowModel.apply(_this, [data.fileName])); //ko observable
                event.preventDefault();
            };

            self.wireframe = function(data, event){
                _this.wireframeView(data.fileName);
                event.preventDefault();
            }


            self.solid = function(data, event){
                _this.solidView(data.fileName);
                event.preventDefault();
            }

            self.collapse_expand = function(data, event){
                
                event.preventDefault();
            }


            self.href = "#" + imIndex;

            var curindex = imIndex;

            self.setTransparencyVal = function (element, transparency) {
                element.css({ "width": transparency + "%" });
            };

          


            self.mouseWheel = function (event) {

                var mesh = TOOLS.getModelsByName(self.fileName);
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

          

            self.updateTransparency = function () {
                var mesh = TOOLS.getModelsByName(self.fileName);
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

         

            self.isVisible = function () {
                return self.visible();
            };

         
           

        };

        //push in view array
        viewmodels.modelsInformation.push(new modelInfo());
        imIndex++;
    });  
   
}


/*Creates progress with: id(Id of the progress), parent(parent element to add to)*/
init.prototype.createProgress = function (id, parent) {

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
    else if(vertexCount >=5000)
        return vertexCount/ 27;

    return 3;
}


init.prototype.sendEmails = function(sessionInfo) {
    $.ajax({
        url: "SendEmails/",
        type: "POST",
        contentType: "application/json",
        processData: false,
        cache: false,
        data: JSON.stringify(sessionInfo),
        dataType: 'json',
        success: function (data) {
            if (data === false) {
                toastr.error('Email sent failed', 'Error !');
            }
            else {
                if (data.Emails && data.Emails.length > 0) {
                    toastr.success('Emails sent to ' + data.sessionEmails);
                    console.log("Email notification request was sent successfully");
                }
            }
        },
        error: function (data) {
            toastr.error('Email sent failed', 'Error !');            
        },
        statusCode: {
            401: function (data) {               
                toastr.error('You need to login first.', 'Error !');
                userAccess.requestUserAuth();

            }
        }
    });
}

init.prototype.sendModelsToServer = function (sessionInfo) {

    var unique = undefined; //unique key associated with this scene
    var meshIndex = 0, childIndex = 0;
    var _this = this;

    var childrenCount = _this.glScene.__objects.length;

    var curVertexIndex = 0;
    var sessionImage;

    //collection all meshes suitable for send
    var meshesToSend = [];
    for (var m = 0; m < childrenCount; m++) {

        var me = _this.glScene.__objects[m];

        if (me.Format === "obj" && !(me instanceof THREE.Mesh) && me.children.length > 0)
            meshesToSend = meshesToSend.concat(me.children);
        else if (me.Format === "stl")
            meshesToSend.push(me);
    }

    var uploadComplete = function () {

        /**Check either upload of all models terminated*/
        $("#flprogress").remove();
        toastr.success('Upload of all models done.', 'Success !');

        //upload of all models termianted, so let's send notifications via mail, if necessary 
        _this.sendEmails(sessionInfo);

    }

    var isUploadDone = function () {
        return (meshIndex >= childrenCount);
    }


    var imageReady = function (resizedImage) {

        //get resized image
        sessionImage = resizedImage;

        //start async upload
        async.until(isUploadDone, uploadSingleModel, uploadComplete); //async call 
    }

    var uploadSingleModel = function (iterator) {

        var mesh = meshesToSend[meshIndex];



        if (!mesh || !mesh.children) {
            meshIndex++;
            iterator();
            return;
        }

        var geometryMesh = mesh.children[0];

        if (!geometryMesh) {
            meshIndex++;
            iterator();
            return;
        }

        if (!geometryMesh.name) {
            geometryMesh.name = mesh.name;
            if (!geometryMesh.name) {
                geometryMesh.name = "child";
            }

        }

        var vertices = [];

        //collect all vertices 
        var colorsSplit = [];
        var faces = geometryMesh.geometry.faces;
        var geoVertices = geometryMesh.geometry.vertices;
        for (var f = 0; f < faces.length; f++) {
            var face = faces[f];
            var vertexColor = geoVertices[face.a].vertexColor;

            vertices.push(geoVertices[face.a]);
            vertices.push(geoVertices[face.b]);
            vertices.push(geoVertices[face.c]);

        }

        var verticesCount = vertices.length;

        var step = parseInt(_this.getPacketSize(verticesCount));


        if (curVertexIndex === 0) {
            _this.showUploadProgress(mesh.name, 0);
        }

        var firstLoad = false;


        function currentModelSequence() {

            var verticesSplit = new Array();

            while (curVertexIndex < verticesCount) {
                var gv = vertices[curVertexIndex];
                var shorten = utils.vertexToShorten(gv);


                var vertex = "x:" + shorten.x + " " + "y:" + shorten.y + " " + "z:" + shorten.z;
                var vertexColor = gv.vertexColor;
                if (vertexColor)
                    vertex += " c:" + vertexColor;


                verticesSplit.push(vertex);

                curVertexIndex++;

                /*In case of first vertex in the model just push it raise ajax. So we will check for authentication requeirement,
                and no any relation with the models size, as we push ALWAYS only 1 vertex on first step for ANY model*/
                if (curVertexIndex == 1)
                    break;


                if (verticesSplit.length % step === 0)
                    break;
            }

            var basicColor = geometryMesh.color;
            if (basicColor == undefined)
                basicColor = mesh.color;

            var modelInfo = {
                ModelName: mesh.name,
                Size: mesh.filesize,
                Format: "stl",
                ID: sessionInformation.link || unique,
                Vertices: verticesSplit,
                VertexCount: verticesCount,
                Color: basicColor,               
                SessionName: sessionInfo.SessionName
            };


            if (curVertexIndex === 1 && !firstLoad) {
                modelInfo.ModelImage = sessionImage;
                modelInfo.Notes = notesmodel.forJSON();

                firstLoad = true;
            }

            var requestUrl = "SaveModel/";
            if (sessionInformation.link)
                requestUrl = "../SaveModel/";

            $.ajax({
                url: requestUrl,
                type: "POST",
                contentType: "application/json",
                processData: false,
                cache: false,
                data: JSON.stringify(modelInfo),
                dataType: 'json',
                success: function (data) {

                    //error happened on server
                    if (data === false) {
                        toastr.error('Error on save.', 'Error !');
                        $("#flprogress").remove();
                        return;
                    }

                    //get the unique key associated to this model+scene, generated by the server
                    unique = data;

                    //if I'm not at the end of the collection, call my self to go ahead
                    if (curVertexIndex < verticesCount) {
                        currentModelSequence();
                        _this.showUploadProgress(mesh.name, 100 / (verticesCount / curVertexIndex));
                    }
                    else {
                        //load another model


                        meshIndex++;


                        curVertexIndex = 0;
                        _this.showUploadProgress(mesh.name, 100);

                        iterator();
                        // uploadSingleModel(); //call to upload another model in collection, if any
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
    };




    //get resized screen shot of the screen
    _this.takeScreenshot(false, 560, 400, imageReady);
}

init.prototype.showSessionModal = function (onOkCallback, onCancelCallback) {
    //show modal window 
    jQuery('<div/>', {
        id: 'session',
        class: 'modal hide fade gridbody'
    }).appendTo($("#body"));

    
    var session = $("#session");
    session.html(" <div class='modal-header'>" +
                     "<h3>Set session info to share</h3>" +
                 "</div>" +
                 "<div class='modal-body'>" +
                   "<input id='sessionnametext' type='text' style='width: 35em;' maxlength='50' placeholder='Insert session name here...'>" +
                   "<input id='notificationemails' type='text' class='input-small' style='width: 35em;' maxlength='150' placeholder='Insert emails separated by space to send notification to '>" +
                 "</div>" +
                 "<div class='modal-footer'>" +
                 "<button id='startsharing' type='button' data-dismiss='modal' class='btn btn-success btn-medium'>Share</button>" +
                 "<button id='cancelsharing' type='button' data-dismiss='modal' class='btn btn-danger btn-medium'>Cancel</button>" +
                 "</div>");

    $("#startsharing").click(function () {

        //call OK callback if any
        if (onOkCallback) {
            var sessionName = $("#sessionnametext")[0].value;
            var emails =  $("#notificationemails")[0].value;
            onOkCallback(sessionName, emails);
        }

        //hide and remove element
        session.modal('hide');
        session.remove();
    });

    $("#cancelsharing").click(function () {
       
        if(onCancelCallback)
            onCancelCallback();

        session.modal('hide');
        session.remove();
    });


    session.modal();



}

/*Sends all files on the scene to the server*/
init.prototype.sendContentToServer = function () {

    var _this = this;

    var okCallback = function (sessionName, emails) {
        var sessionManifest = sessionInformation.getSessionManifest(sessionName, "", emails, utils.getCurrentDateTime());
        _this.sendModelsToServer(sessionManifest);
    };
    _this.showSessionModal(okCallback);

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
                if (tempModel.SessionName === undefined)
                    tempModel.SessionName = data.SessionName;
                if (tempModel.User === undefined)
                    tempModel.User = data.User;
                if (tempModel.SavedOn === undefined)
                    tempModel.SavedOn = data.SavedOn;

                //ONLY FOR THE FIRST MODEL
                if (mindex == 0 && tempModel.Notes === undefined) {
                    tempModel.Notes = data.Notes
                }
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
                    if (packet == 0) {
                        _this.showDownloadProgress(tempModel.ModelName, 0);
                        //add session information label 

                    }
                    else {
                        _this.showDownloadProgress(tempModel.ModelName, 100 / (tempModel.VertexCount / tempModel.Vertices.length));
                    }


                    var vertices = [];
                    for (var v = 0; v < data.Vertices.length; v++) {
                        var splitted = data.Vertices[v].split(/:| /);
                        var vertex = new THREE.Vector3(parseFloat(splitted[1]), parseFloat(splitted[3]), parseFloat(splitted[5]));

                        if (splitted.length > 6) { //there is a color information                        
                            vertex.vertexColor = splitted[7];
                        }

                        vertices.push(vertex);
                    }

                    tempModel.Vertices = tempModel.Vertices.concat(vertices); //concatenate vertices arrived to already available ones
                    packet++;
                    load(); //call myself again
                }
                else {
                    //all done
                    $("#flprogress").remove();
                    toastr.success('Got all models from the server. Now begin processing', 'Success !');

                    var loaderGif = $("#loader");
                    if (loaderGif !== undefined)
                        loaderGif.remove();


                    //set the current session information unique link
                    sessionInformation.link = unique;

                    _this.loadMeshesFromServer(models); //load models to scene
                    models = []; //reset collection of the models

                }

            }
        });
    })();




}

init.prototype.finalizeLoading = function (meshes) {
    this.loadMeshesInformation.apply(this);
    
    $.geoData = new GeoData();
    
}

init.prototype.removeAxis = function() {
      
      //collect all geometry data of the axis
      var meshesToRemove = [];
      TOOLS.forEachMesh(function (mesh) {           
             meshesToRemove.push(mesh);            
        }, function (mesh) {          
            return mesh.arrow !== undefined;
           }
        );

       for(var i=0;i<meshesToRemove.length;i++) 
          TOOLS.removeMesh(meshesToRemove[i]);

}

init.prototype.drawAxis = function(scene, length) {
    
    var cylinder = new THREE.CylinderGeometry(0.06,0.06, length, 28, 28);
    var cone     = new THREE.CylinderGeometry(0.18,0.01,1, 16,16);
  

    //X axis
    var materialx = new THREE.MeshPhongMaterial({color: 0xFF0000});
    var xAxis = new THREE.Mesh(cylinder, materialx);
   
    var conex     = new THREE.Mesh(cone, materialx);
    conex.position.y += -length/2;
    
    var compositex = new THREE.Object3D();
    compositex.add(xAxis);
    compositex.add(conex);
    
    compositex.rotation.z = 90 * Math.PI/180;
    compositex.position.x += length/2;

    compositex.arrow = true;
    scene.add(compositex);

    //Y axis
    var materialy = new THREE.MeshPhongMaterial({color: 0x00FF00});   
    var yAxis = new THREE.Mesh(cylinder, materialy);  

    var coney     = new THREE.Mesh(cone, materialy);
    coney.position.y += length/2;
    coney.rotation.x = Math.PI;

    var compositey = new THREE.Object3D();
    compositey.add(yAxis);
    compositey.add(coney);

    compositey.position.y += length/2;
    compositey.arrow = true;
    scene.add(compositey);

    //Z axis
    var materialz = new THREE.MeshPhongMaterial({color: 0x0000FF});   
    var zAxis = new THREE.Mesh(cylinder, materialz);  

    var conez     = new THREE.Mesh(cone, materialz);
    conez.position.y += length/2;
    conez.rotation.x = Math.PI;

    var compositez = new THREE.Object3D();
    compositez.add(zAxis);
    compositez.add(conez);

    compositez.rotation.x = 90 * Math.PI/180;
    compositez.position.z += length/2;
    compositez.arrow = true;
    scene.add(compositez);

    //center 

    var centerMesh = new THREE.Mesh(new THREE.SphereGeometry(0.15,18,18), new THREE.MeshPhongMaterial({color: 0x111111}));
    centerMesh.arrow = true;
    scene.add(centerMesh);
   
}


init.prototype.showAxis = function() {

     if(this.axisVisible) {
        this.removeAxis();
        this.axisVisible = false;
     }
     else {
         var    bounds = TOOLS.getSceneBoundingBox();
         var diag = new THREE.Vector3();
         diag = diag.subVectors(bounds.max, bounds.min);
         var diagLength = diag.length();

        //create axis
//         var axis = new THREE.AxisHelper(diagLength);    
//         axis.arrow = true;
//         this.glScene.add( axis );      

         this.drawAxis(this.glScene, diagLength);

         //x text
         var shapex = new THREE.TextGeometry("X", {font: 'helvetiker', height:0.5, size:2});
         var wrapperx = new THREE.MeshNormalMaterial({color: 0x111111});
         var xAxis = new THREE.Mesh(shapex, wrapperx);
         xAxis.position = new THREE.Vector3(diagLength - 2, 0,0); 
         xAxis.arrow = true;
         this.glScene.add(xAxis);

         //y text
         var shapey = new THREE.TextGeometry("Y", {font: 'helvetiker', height:0.5, size:2});
         var wrappery = new THREE.MeshNormalMaterial({color: 0x111111});
         var yAxis = new THREE.Mesh(shapey, wrappery);
         yAxis.position = new THREE.Vector3(0, diagLength - 2,0); 
         yAxis.arrow = true;
         this.glScene.add(yAxis);

         //z text
         var shapez = new THREE.TextGeometry("Z", {font: 'helvetiker', height:0.5, size:2});
         var wrapperz = new THREE.MeshNormalMaterial({color: 0x111111});
         var zAxis = new THREE.Mesh(shapez, wrapperz);
         zAxis.position = new THREE.Vector3(0, 0,diagLength - 2);      
         zAxis.arrow = true;
         this.glScene.add(zAxis);

         this.axisVisible = true;
     }
}



init.prototype.hidePanels = function (all) {
    $("#3DArea").css("visibility", "hidden");
    $("#basicPanel").css("visibility", "hidden");
    $("#perspective_orthogrphic").css("visibility", "hidden");
    $("#expandfileInfo").css("visibility", "hidden");
    

}

init.prototype.showPanels = function (all) {

    $("#3DArea").css("visibility", "visible");
    $("#basicPanel").css("visibility", "visible");
    $("#perspective_orthogrphic").css("visibility", "visible");
    $("#expandfileInfo").css("visibility", "visible");
}


/*look from
vector - view vector 
offset - offset to get from the vector edge
axis   -  to align to (can be not specified)
bounds bounds to align to
*/
init.prototype.lookFrom = function (vector, offset, axis, bounds) {


    if (bounds === undefined)
        bounds = TOOLS.getSceneBoundingBox();

    var center = new THREE.Vector3();
    center.x = (bounds.min.x + bounds.max.x) / 2;
    center.y = (bounds.min.y + bounds.max.y) / 2;
    center.z = (bounds.min.z + bounds.max.z) / 2;

    //this.sceneTracker.center = center;
    this.sceneTracker.target = center;

    var diag = new THREE.Vector3();
    diag = diag.subVectors(bounds.max, bounds.min);
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

    if(this.pointlight === undefined) {
        this.pointlight = new THREE.PointLight(0xFFFFFF, 0.9);
        scene.add(this.pointlight);
    }


    if(this.directionalLight === undefined) {
        this.directionalLight = new THREE.DirectionalLight( 0xffffff, 0.1 );
	    this.directionalLight.position.set( camera.position.x, camera.position.y, camera.position.z );
        scene.add(this.directionalLight);
    }

    if(this.ambientLight === undefined)  {
        this.ambientLight = new THREE.AmbientLight( 0x444444 );
        scene.add(this.ambientLight);
    }

  
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

    //init STL loader
    _this.modelLoader = new ModelLoader(this.glScene, this.glCamera, this.glRenderer, this.sceneTracker);

    _this.hidePanels();
}

/*load the sequence of files in async*/
init.prototype.LoadFiles = function (files) {

    if (files === undefined)
        return;

    var _this = this;
    _this.initScene(_this);


    var index = files.length - 1;
    var sinfo = undefined;

    //load in async way
    var loadAsync = function () {
        if (index < 0) {

            _this.fitCamera.apply(_this, [_this.glScene, _this.glCamera, _this.sceneTracker]); //fit camera on end
            _this.renderOnScreen(); //render
            _this.finalizeLoading.apply(_this);
            _this.showPanels(); //show panels
          
            // this is Online£D session JSON file load
            // so it contains some additonal information
            if (sinfo) {
                var sessionManifest = sessionInformation.getSessionInforFromOnline3DSession(sinfo);
                //_this.showSessionInfo(sessionManifest); // session info---

                _this.showNotes(sessionManifest.Notes);
            }

            toastr.success('Done !');
            return;
        }


        var store = files[index];

        //get an extension of the file to understand how to treat it
        var extension = store.fileName.split('.').pop();

        if (extension && extension === window.APP_NAME) {

            //this is SESSION file load
            // -----
            sinfo = JSON.parse(store.fileData);
            _this.modelLoader.loadSession(_this.glScene, sinfo, store.fileName, store.fileSize, loadAsync);
           
            index = -1; // there could be only one session file accepted, so break the execution : -1
        }
        else {
            //this is a file load
            _this.modelLoader.loadModel(_this.glScene, store.fileData, store.fileName, store.fileSize, loadAsync);  //load models in async way  
            index--; //decrement index
        }
    };


    loadAsync();
}


init.prototype.showSessionInfo = function (sessionInfo)
{

    return;

    /**Show session information if any**/
    var sinfo = $("#sinfo")[0];
    ko.applyBindings(sessionInfo, sinfo);
    
    /*************************/
}

init.prototype.showNotes = function (notes) {
    for (var i = 0; i < notes.length; i++) {
        var note = notes[i];

        var text = note.NoteText || note.text;
        var vertex = note.NoteVertex || note.vertex;

        notesmodel.addNoteToList(text, i + 1, vertex);
    }

    if (notes.length > 0)
        notesmodel.expand();

}


init.prototype.loadMeshesFromServer = function (meshes) {

    if (meshes === undefined)
        return;

    var _this = this;
    _this.initScene(_this);
    var index = meshes.length - 1;

    var notes = new Array();

    //load in async way
    var loadAsync = function () {
        if (index < 0) {

            _this.fitCamera.apply(_this, [_this.glScene, _this.glCamera, _this.sceneTracker]); //fit camera on end
            _this.renderOnScreen(); //render ---
            _this.finalizeLoading.apply(_this, meshes); //---
            _this.showPanels(); //show panels ---   

            var sinfo = sessionInformation.getSessionInfoFromMeshes(meshes);
            _this.showSessionInfo(sinfo); // session info---
            
            _this.showNotes(notes);
                 
            toastr.success('Done !');
            return;
        }
        var mesh = meshes[index];
        
        //save notes, as they are present in only one model of possible multiple models present in session 
        //
        if(mesh.Notes !== undefined) 
            notes = mesh.Notes;

        _this.modelLoader.loadMeshModel(mesh, loadAsync);
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
init.prototype.solidView = function (meshname) {

    //iterating over meshes
    TOOLS.forEachMesh(function (mesh) {
        if (!mesh.visible)
            return;

        //caller specified the concrete model name to act on
        //so if currrent model is not requested one, just skip it
        if(meshname !== undefined && meshname !== mesh.name)
            return;

        mesh.children[0].visible = true;
        mesh.children[1].visible = false;

    });
}

init.prototype.orthographicView = function () {
    this.glCamera.setZoom(1);
    this.glCamera.toOrthographic();
}


init.prototype.perspectiveView = function () {
    this.glCamera.setZoom(1);
    this.glCamera.toPerspective();
}

/*View models wireframe(triangles)*/
init.prototype.wireframeView = function (meshname) {

    TOOLS.forEachMesh(function (mesh) {
        if (!mesh.visible)
            return;

        if (!mesh.visible)
            return;

        //caller specified the concrete model name to act on
        //so if currrent model is not requested one, just skip it
        if(meshname !== undefined && meshname != mesh.name)
            return;

        mesh.children[0].visible = false;
        mesh.children[1].visible = true;
    });


}

/*View models like mesh(solid model + wireframe)*/
init.prototype.meshView = function () {

    TOOLS.forEachMesh(function (mesh) {

        if (!mesh.visible)
            return;

        mesh.children[0].visible = true;
        mesh.children[1].visible = true;
    });

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

