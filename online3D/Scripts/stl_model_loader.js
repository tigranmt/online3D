
function STL(scene, camera, renderer, tracker) {
    var glScene = scene;
    var glCamera = camera;
    var glRender = renderer;
    var sceneTracker = tracker;

    //main method that loads STL models
    this.loadStlModel = function (data, fileName, fileSize, nextCallback) {


        if (!fileName || !fileSize) {
            toastr.error('Can not load file', 'Error');
            return;
        }


        var extension = fileName.split('.').pop();
        if (extension.toUpperCase() === "STL") {
            new genericStlFileLoader().loadStlData(data, fileName, fileSize, nextCallback);
        }
        else
            throw 'Not recognized file format';
    }

    this.loadMeshModel = function (object, nextCallback) {
        if (object === undefined || object.Size === undefined) {
            toastr.error('Can not load mesh', 'Error');
            return;
        }

        if (object.Format.toUpperCase() === "STL") {
            new genericStlFileLoader().loadMeshData(object, nextCallback);
        }
        else
            throw 'Not recognized file format';
    }


    ///Base class for BinaryStl and AsciiStl loaders, with some set of common functions
    function genericStlFileLoader() {


        this._scene = glScene; //scene
        this._camera = glCamera;
        this._renderer = glRender;
        this._tracker = sceneTracker;
        this.total = 0; //total count to read for progress
        var _this = this;
        var _progressIndicator = undefined;
        var _finishCallback = undefined;
        var _nextByteIndex = 0;
        var _timeOut = undefined;

   

        this.getMeshCenter = function (mesh) {

            var geom = mesh.geometry;
            geom.computeBoundingBox();
            var box = geom.boundingBox;

            var center = new THREE.Vector3();
            center.x = (box.min.x + box.max.x) / 2;
            center.y = (box.min.y + box.max.y) / 2;
            center.z = (box.min.z + box.max.z) / 2;

            return center;
        }

        //sets the total count for loading progress control
        //can define the funciton that has to be called on loading end
        this.setTotalAndFunc = function (total, callback, finishCallback) {

            if (_progressIndicator === undefined) { //init
                _progressIndicator = $("#progress").percentageLoader({ width: 130, height: 130, progress: 0.1, onProgressUpdate: function (val) {
                    _progressIndicator.setValue(Math.round(val * 100.0));
                }
                });
            }
            $("#progress").show();
            _this.total = total;
            _callback = callback;
            _finishCallback = finishCallback;

        }


        //run progress and updates UI component
        this.runProgressLoader = function (onFinishCallback) {

            if (_progressIndicator === undefined)
                return;

            var current = _callback();
            _progressIndicator.setProgress(current / _this.total);

            var procent = Math.floor((current / _this.total) * 100);
            _progressIndicator.setValue(procent.toString() + '%');

            if (current < _this.total) {
                clearTimeout(_timeOut);
                _timeOut = setTimeout(_this.runProgressLoader, 25);
            } else {
                clearTimeout(_timeOut);
                delete _timeOut;
                _progressIndicator.setProgress(1);
                _progressIndicator.setValue('100%');
                _finishCallback();

            }

        }


        function readBytes(_fileData, count) {
            var i = 0;
            var result = [];

            while (count > 0) {
                result.push(_fileData[_nextByteIndex]);
                _nextByteIndex++;
                count--;
            }
            return result;
        }

        //reads float value from byte stream
        function readFloat(_fileData) {
            var single = parseFloat(readBytes(_fileData, 4).join(''));
            return single;
        }

        //checks either speciied file is ASCII or BINARY stl file
        function IsAsciiStl(file) {
            var MAX_MODEL_NAME_LENGTH = 80;
            var STL_HEADER_SIZE = MAX_MODEL_NAME_LENGTH + 4;
            var solid = file[0] + file[1] + file[2] + file[3] + file[4];

            if (solid != "solid")
                return false;

            var fileLength = file.length;
            if (fileLength < 180)
                return false;

            var index = 5;
            var end = STL_HEADER_SIZE + 100;
            for (var i = 0; i < 10; i++) {
                var line = "";

                while (file[index] != "\n") {
                    line += file[index];
                    index++;
                }
                if ("outer loop" === line.substring(0, 10))
                    return true;

                index++;
            }

            return false;
        }


        this.loadMeshData = function(object, callback) {
            var stlLoader = new meshLoader();
            stlLoader.load(object,callback);
        }
     

        //picks correct concrete loader for given file (Binary or Ascii)
        this.loadStlData = function (_fileData, fileName, size, callback) {

            var stlLoader;
            var isAcii = IsAsciiStl(_fileData);

            if (isAcii) {
                stlLoader = new asciStlFileLoader();

            }
            else {
                stlLoader = new binaryStlFileLoader();
            }

            var loadSuceed = undefined;
            if (stlLoader != undefined) {
                loadSuceed = stlLoader.load(_fileData, fileName, size, callback);
            }

        }

    }

    ///Concrete implementaiton on loader of BINARY stl file
   
    function binaryStlFileLoader() {

        var _this = this;


        //loads binary STL
        this.load = function (_fileData, fileName, fileSize, callback) {

            //use BinaryReader
            var bReader = new BinaryReader(_fileData);
            var name = bReader.readString(80);
            var _callback = callback;


            /*read traingles count*/
            var triangleCount = undefined;
            try {

                var uint0 = bReader.readUInt8();
                var uint1 = bReader.readUInt8() * Math.pow(2, 8);
                var uint2 = bReader.readUInt8() * Math.pow(2, 16);
                var uint3 = bReader.readUInt8() * Math.pow(2, 24);

                triangleCount = uint0 + uint1 + uint2 + uint3;
            }
            catch (err) {
                toastr.error("Not valid STL file", 'Error');
                return;
            }
            /**/


            if (!triangleCount) {
                toastr.error("Empty STL file", 'Error');
                return;
            }


            //begin contructiing geometry
            var geometry = new THREE.Geometry();

            var i = 0;
            var readSizeTotal = triangleCount;
            var vertexCount = 0;
            var faceCountCount = 0;

            var modelColor = Math.random() * 0xffffff;


            this.setTotalAndFunc(triangleCount, function () {

                //just define a step of 1/1000 of the quantity of triangles in the mesh
                var index = fileSize / 1000;

                while (readSizeTotal > 0 && index >= 0) {
                    //Don't need first 12 bytes, the normal of the triangle            
                    bReader.readFloat();
                    bReader.readFloat();
                    bReader.readFloat();

                    var vertex0 = { x: 0, y: 0, z: 0 }, vertex1 = { x: 0, y: 0, z: 0 }, vertex2 = { x: 0, y: 0, z: 0 };

                    vertex0.x = bReader.readFloat();
                    vertex0.y = bReader.readFloat();
                    vertex0.z = bReader.readFloat();

                    vertex1.x = bReader.readFloat();
                    vertex1.y = bReader.readFloat();
                    vertex1.z = bReader.readFloat();

                    vertex2.x = bReader.readFloat();
                    vertex2.y = bReader.readFloat();
                    vertex2.z = bReader.readFloat();

                    //push vertices to mesh  
                    geometry.vertices.push(new THREE.Vector3(vertex0.x, vertex0.y, vertex0.z));
                    geometry.vertices.push(new THREE.Vector3(vertex1.x, vertex1.y, vertex1.z));
                    geometry.vertices.push(new THREE.Vector3(vertex2.x, vertex2.y, vertex2.z));

                    //trianlge color information (SKIP FOR NOW)
                    var faceColor = bReader.readUInt16();

                    var fBlue = faceColor & 0x1F;
                    var fGreen = (faceColor >> 5) & 0x1F;
                    var fRed = (faceColor >> 10) & 0x1F;

                    var ubRed = (fRed / 32 * 256);
                    var ubGreen = (fGreen / 32 * 256);
                    var ubBlue = (fBlue / 32 * 256);

                    var length = geometry.vertices.length;
                    var face = new THREE.Face3(length - 3, length - 2, length - 1, 1);

                    face.color.setHex(modelColor);

                    geometry.faces.push(face);
                    index--;
                    i++;
                    readSizeTotal--;
                }
                return i;
            }, function () {
                if (geometry.vertices.length > 0) {

                    var meshMaterial = new THREE.MeshPhongMaterial({ ambient: 0x222222, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, perPixel: false, overdraw: false });
                    var meshWireframe = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true });
                    var multiMaterial = [meshMaterial, meshWireframe];

                    geometry.computeFaceNormals();
                    geometry.computeVertexNormals();
                  
                    geometry.__dirtyColors = true;
                    var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, multiMaterial);

                    //set additional mesh data
                    mesh.name = fileName;
                    mesh.facecount = geometry.faces.length;
                    mesh.verticescount = geometry.vertices.length;
                    mesh.filesize = Math.round((fileSize / 1024) * 100) / 100;
                    mesh.color = modelColor;


                    _this._scene.add(mesh);
               
                    $("#progress").hide();


                    if (_callback != undefined)
                        _callback();


                }
            });


            this.runProgressLoader();


        };

    }
    binaryStlFileLoader.prototype = new genericStlFileLoader();
    binaryStlFileLoader.prototype.constructor = binaryStlFileLoader;


  
    function asciStlFileLoader() {

        var _this = this;
        var _triangleStarted = false;
        var _nextByteIndex = 0;

        this.load = function (_fileData, fileName, fileSize, callback) {

            var _callback = callback;

            function GetNextLineFromAsciStl(_fileData, fileSize) {
                var asciByte = _fileData[_nextByteIndex];
                var line = "";
                while (asciByte != "\n" && _nextByteIndex < fileSize) {
                    line += asciByte;
                    _nextByteIndex++;
                    asciByte = _fileData[_nextByteIndex];
                }
                _nextByteIndex++;
                return line;
            }

            function IfVertexLine(_fileLine) {
                var vertexString = _fileLine[0] + _fileLine[1] + _fileLine[2] + _fileLine[3] + _fileLine[4] + _fileLine[5];
                return (vertexString == "vertex");
            }

            function vertexFromVertexLine(line) {

                var splittedArray = line.split(" ");
                if (!splittedArray ||
                 splittedArray.length != 4)
                    return;

                return [parseFloat(splittedArray[1]),
                      parseFloat(splittedArray[2]),
                        parseFloat(splittedArray[3])];

            }



            var geometry = new THREE.Geometry();
            var verticesCount = 0;


            var modelColor = Math.random() * 0xffffff; // random model's faces color


            //set total size
            this.setTotalAndFunc(fileSize, function () {

                //just define a step of 1/1000 of the quantity of triangles in the mesh
                var index = fileSize / 1000;

                while (index >= 0) {
                    var line = GetNextLineFromAsciStl(_fileData, fileSize);

                    if (line == "outer loop")
                        _triangleStarted = true;
                    else if (line == "endloop") {

                        _triangleStarted = false;
                    }
                    else if (_triangleStarted) {
                        if (IfVertexLine(line)) {
                            var vtx = vertexFromVertexLine(line);
                            if (!vtx) {
                                _triangleStarted = false;
                            }
                            else {

                                geometry.vertices.push(new THREE.Vector3(vtx[0], vtx[1], vtx[2]));
                                verticesCount++;

                                //this is triangle, so create a new face
                                if (verticesCount == 3) {
                                    var length = geometry.vertices.length;
                                    var face = new THREE.Face3(length - 3, length - 2, length - 1, 1);
                                    face.color.setHex(modelColor);
                                    geometry.faces.push(face);
                                    verticesCount = 0;
                                }
                            }
                        }
                    }

                    index--;
                }

                return _nextByteIndex;
            }, function () {

                //vertices are loaded 
                if (geometry.vertices.length > 0) {

                    //finalizing loading of the geometry

                    //consruct mesh
                    var meshMaterial = new THREE.MeshPhongMaterial({ ambient: 0x222222, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, perPixel: false, overdraw: true });
                    var meshWireframe = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true });
                    var multiMaterial = [meshMaterial, meshWireframe];

                    //normals calculation for correct lighting
                    geometry.computeFaceNormals();
                    geometry.computeVertexNormals();

                    geometry.__dirtyColors = true;
                    var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, multiMaterial);

                    //set additional mesh data
                    mesh.name = fileName;
                    mesh.facecount = geometry.faces.length;
                    mesh.verticescount = geometry.vertices.length;
                    mesh.filesize = Math.round((fileSize / 1024) * 100) / 100;
                    mesh.color = modelColor;
                    _this._scene.add(mesh); //add to scene

                    $("#progress").hide();

                    if (_callback != undefined)
                        _callback();


                }
            });

            this.runProgressLoader();




        }
    }
    asciStlFileLoader.prototype = new genericStlFileLoader();
    asciStlFileLoader.prototype.constructor = asciStlFileLoader;


    function meshLoader() {

        var getTrianglesCountInPacket = function(vertexCount) {
            if(vertexCount >=100000)
               return 3000;    
            else if(vertexCount >=40000)
               return 1500;
            else if(vertexCount >=10000)
               return 1200;

            return 1;
        }

        /** Loads mesh (object) and accepts nect call (callback) procedure **/
        this.load = function (object, callback) {

            var _callback = callback;
            var _this = this;


            var geometry = new THREE.Geometry();
            var modelColor = object.Color;
            var vertices = object.Vertices;
            var i = 0;
            var allVerticesCount = vertices.length;

            //set total size
            this.setTotalAndFunc(allVerticesCount, function () {

                //just define a step of 1/1000 of the quantity of triangles in the mesh
                var index = parseInt(getTrianglesCountInPacket(allVerticesCount));
                var verticesCount = 0;

                while (index > 0 && i < allVerticesCount) {

                    geometry.vertices.push(new THREE.Vector3(vertices[i].x, vertices[i].y, vertices[i].z));
                    verticesCount++;

                    //this is triangle, so create a new face
                    if (verticesCount == 3) {
                        var length = geometry.vertices.length;
                        var face = new THREE.Face3(length - 3, length - 2, length - 1, 1);
                        face.color.setHex(modelColor);
                        geometry.faces.push(face);
                        verticesCount = 0;
                    }

                    index--;
                    i++;
                }

                return i;
            }

                , function () {

                    //vertices are loaded 
                    if (geometry.vertices.length > 0) {

                        //consruct mesh
                        var meshMaterial = new THREE.MeshPhongMaterial({ ambient: 0x222222, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, perPixel: false, overdraw: true });
                        var meshWireframe = new THREE.MeshBasicMaterial({ color: 0x555555, wireframe: true });
                        var multiMaterial = [meshMaterial, meshWireframe];

                        //normals calculation for correct lighting
                        geometry.computeFaceNormals();
                        geometry.computeVertexNormals();

                        geometry.__dirtyColors = true;
                        var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, multiMaterial);

                        //set additional mesh data
                        mesh.name = object.ModelName;
                        mesh.facecount = geometry.faces.length;
                        mesh.verticescount = geometry.vertices.length;
                        mesh.filesize = object.Size;
                        mesh.color = modelColor;
                        _this._scene.add(mesh); //add to scene

                        $("#progress").hide();

                        if (_callback != undefined)
                            _callback();


                    }
                });

            this.runProgressLoader();




        }
    }

    meshLoader.prototype = new genericStlFileLoader();
    meshLoader.prototype.constructor = meshLoader;



}


