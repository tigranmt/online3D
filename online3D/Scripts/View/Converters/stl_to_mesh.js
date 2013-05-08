/*****
Converts STL (binary or ascii) to Three.js  mesh and adds it to a scene
Dependency async.js
**/
function StlToMesh() {



    var readBytes = function (_fileData, count) {
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
    var readFloat = function (_fileData) {
        var single = parseFloat(readBytes(_fileData, 4).join(''));
        return single;
    }

    //checks either speciied file is ASCII or BINARY stl file
    var isAsciiStl = function (file) {
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

    this.loadModelAsync = function (scene, _fileData, fileName, fileSize, progressCallback, finishCallback) {
        var stlLoader;
        var isAcii = isAsciiStl(_fileData);

        if (isAcii) {
            stlLoader = new asciStlFileLoader();
        }
        else {
            stlLoader = new binaryStlFileLoader();
        }

        var loadSuceed = undefined;
        if (stlLoader != undefined) {
            loadSuceed = stlLoader.loadAsync(scene, _fileData, fileName, fileSize, progressCallback, finishCallback);
        }

    }



    /*Reads the BINARY stl into geometry*/
    function binaryStlFileLoader() {

        var _this = this;


        //loads binary STL
        this.loadAsync = function (scene, fileData, fileName, fileSize, progressCallback, finishCallback) {

            //use BinaryReader
            var bReader = new BinaryReader(fileData);


            var name = bReader.readString(80); // read name
            var _finishCallback = finishCallback || function () { };
            var _progressCallback = progressCallback || function () { };
            var _scene = scene;


            /*read traingles count*/
            var triangleCount = undefined;
            try {

                var uint0 = bReader.readUInt8();
                var uint1 = bReader.readUInt8() * Math.pow(2, 8);
                var uint2 = bReader.readUInt8() * Math.pow(2, 16);
                var uint3 = bReader.readUInt8() * Math.pow(2, 24);

                triangleCount = uint0 + uint1 + uint2 + uint3; //triangle count
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


            //create geometry
            var geometry = new THREE.Geometry();

            var i = 0;
            var readSizeTotal = triangleCount;
            var vertexCount = 0;
            var faceCountCount = 0;
            var done = false;
            var modelColor = Math.random() * 0xffffff;

            //single step runner
            var readStep = function (iterator) {

                //just define a step of 1/1000 of the quantity of triangles in the mesh
                var index = fileSize / 1000;

                if (readSizeTotal === 0) {
                    done = true;
                }
                else {

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

                
                        var length = geometry.vertices.length;
                        var face = new THREE.Face3(length - 3, length - 2, length - 1, 1);

                        //face.color.setHex(modelColor);
                        if(faceColor !== 0)
                            face.color.setHex(faceColor);
                        else
                            face.color.setHex(modelColor);

                        geometry.faces.push(face);
                        index--;
                        i++;
                        readSizeTotal--;
                    }
                }

                iterator();
            }
            //---

            //Check if loading done 
            var isLoadingDone = function () {
                _progressCallback(i, triangleCount); //run progress if defined
                return done;
            }
            // ----


            //Run on complete
            var complete = function () {

                if (geometry.vertices.length > 0) {

                    var meshMaterial = new THREE.MeshPhongMaterial({ ambient: 0x222222, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, perPixel: false, overdraw: true, side: THREE.DoubleSide });
                    var meshWireframe = new THREE.MeshBasicMaterial({ color: 0x111111, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, wireframe: true });
                    var multiMaterial = [meshMaterial, meshWireframe];

                    geometry.computeFaceNormals();
                    geometry.computeVertexNormals();
                  

                    //geometry.__dirtyColors = true;
                    var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, multiMaterial);

                    //set additional mesh data
                    mesh.name = fileName;
                    mesh.facecount = geometry.faces.length;
                    mesh.verticescount = geometry.vertices.length;
                    mesh.filesize = Math.round((fileSize / 1024) * 100) / 100;
                    mesh.color = modelColor;
                    _scene.add(mesh);
                }

                _finishCallback();

            }
            // ---- 

            async.until(isLoadingDone, readStep, complete);
        };

    }



    function asciStlFileLoader() {

        var _this = this;
        var _triangleStarted = false;
        var _nextByteIndex = 0;


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


        this.loadAsync = function (scene, fileData, fileName, fileSize, progressCallback, finishCallback) {


            var _scene = scene;
            var _finishCallback = finishCallback || function () { };
            var _progressCallback = progressCallback || function () { };

            var geometry = new THREE.Geometry();
            var verticesCount = 0;


            var modelColor = Math.random() * 0xffffff; // random model's faces color

            var done = false;

            //Check if loading done 
            var isLoadingDone = function () {
                _progressCallback(_nextByteIndex, fileSize); //run progress if defined
                return done;
            }
            // ----

            //single step runner
            var readStep = function (iterator) {
                //just define a step of 1/1000 of the quantity of triangles in the mesh
                var index = fileSize / 1000;

                while (index >= 0) {
                    var line = GetNextLineFromAsciStl(fileData, fileSize);

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
                    else if (line === "")
                        done = true;

                    index--;
                }


                iterator();
            }

            //Run on complete
            var complete = function () {
                //vertices are loaded 
                if (geometry.vertices.length > 0) {

                    //finalizing loading of the geometry

                    //consruct mesh
                    var meshMaterial = new THREE.MeshPhongMaterial({ ambient: 0x222222, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, perPixel: false, overdraw: false, side: THREE.DoubleSide });
                    var meshWireframe = new THREE.MeshBasicMaterial({ color: 0x111111,  vertexColors: THREE.FaceColor, wireframe: true});
                    var multiMaterial = [meshMaterial, meshWireframe];

                    //normals calculation for correct lighting
                    geometry.computeFaceNormals();
                    geometry.computeVertexNormals();

                 //   geometry.__dirtyColors = true;
                    var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, multiMaterial);

                    //set additional mesh data
                    mesh.name = fileName;
                    mesh.facecount = geometry.faces.length;
                    mesh.verticescount = geometry.vertices.length;
                    mesh.filesize = Math.round((fileSize / 1024) * 100) / 100;
                    mesh.color = modelColor;
                    _scene.add(mesh); //add to scene
                }

                _finishCallback();
            }


            async.until(isLoadingDone, readStep, complete);

        }
    }

   
};