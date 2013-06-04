/*****
Converts STL, OBJ, PLY (binary or ascii) to Three.js  mesh and adds it to a scene
Dependency async.js
**/
function ModelToMesh(type) {



    var MODEL_TYPE = type;

    //checks either speciied file is ASCII or BINARY stl file
    this.isAsciiStl = function (file) {

        var reader = new BinaryReader(file);
        reader.seek(80); // skip the header

        var count = reader.readUInt32();

        var predictedSize = 80 /* header */ + 4 /* count */ + 50 * count;
        return reader.getSize() != predictedSize;
    };


    var getCommand = function (isAscii) {
        if (MODEL_TYPE === "STL") {
            if (isAscii) return "stlAscii";
            else return "stlBinary";
        }
        else if (MODEL_TYPE === "OBJ") {
            if (isAscii) return "objAscii";
            else return "objBinary";
        }
        else if (MODEL_TYPE === "PLY") {
            if (isAscii) return "plyAscii";
            else return "plyBinary";
        }
    }

    this.loadModelAsync = function (scene, _fileData, fileName, fileSize, progressCallback, finishCallback) {
        var modelLoader;

        var isAcii = this.isAsciiStl(_fileData);

        var command = getCommand(isAcii);

        switch (command)
        {
            case "stlAscii":
                modelLoader = new AsciStlFileLoader();
                break;

            case "stlBinary":
                modelLoader = new BinaryStlFileLoader();
                break;

            case "objBinary":
                modelLoader = new ObjFileLoader(); 
                break;
        }
     

        var loadSuceed;
        if (modelLoader != undefined) {
            loadSuceed = modelLoader.loadAsync(scene, _fileData, fileName, fileSize, progressCallback, finishCallback);
        }

    }
   
};




/*** ---  STL FILE READERS ---- ****/

/*Reads the BINARY stl into geometry*/
function BinaryStlFileLoader() {

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
                    if (faceColor !== 0)
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

                var mesh = utils.meshFromGeometry(geometry);

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


/*Reads the ASCII stl into geometry*/
function AsciStlFileLoader ()
{

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



        fileData = fileData.replace(/\r/, "\n");
        fileData = fileData.replace(/^solid[^\n]*/, "");
        fileData = fileData.replace(/\n/g, " ");
        fileData = fileData.replace(/facet normal /g, "");
        fileData = fileData.replace(/outer loop/g, "");
        fileData = fileData.replace(/vertex /g, "");
        fileData = fileData.replace(/endloop/g, "");
        fileData = fileData.replace(/endfacet/g, "");
        fileData = fileData.replace(/endsolid[^\n]*/, "");
        fileData = fileData.replace(/\s+/g, " ");
        fileData = fileData.replace(/^\s+/, "");
       
        var points = fileData.split(" ");
        var pointCount = points.length;
        var curIndex = 0;


        //Check if loading done 
        var isLoadingDone = function () {
            _progressCallback(curIndex, pointCount); //run progress if defined
            return done;
        }
        // ----

       

        //single step runner
        var readStep = function (iterator) {


            //just define a step of 1/1000 of the quantity of triangles in the mesh
            while (curIndex < pointCount)
            {
             
                //skip face normals
                curIndex += 3;

                var v0 = new THREE.Vector3(parseFloat(points[curIndex]), parseFloat(points[curIndex + 1]), parseFloat(points[curIndex + 2]));
                var v1 = new THREE.Vector3(parseFloat(points[curIndex + 3]), parseFloat(points[curIndex + 4]), parseFloat(points[curIndex + 5])); 
                var v2 = new THREE.Vector3(parseFloat(points[curIndex + 6]), parseFloat(points[curIndex + 7]), parseFloat(points[curIndex + 8]));

                geometry.vertices.push(v0);
                geometry.vertices.push(v1);
                geometry.vertices.push(v2);
               
                var length = geometry.vertices.length;
                var face = new THREE.Face3(length - 3, length - 2, length - 1, 1);
                face.color.setHex(modelColor);
                geometry.faces.push(face);
              
                curIndex += 9;
            
                if (curIndex % 1000 === 0)
                    break;
            }

            if (curIndex >= pointCount)
                done = true;



            iterator();
        }

        //Run on complete
        var complete = function () {
            //vertices are loaded 
            if (geometry.vertices.length > 0) {

                var mesh = utils.meshFromGeometry(geometry);

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

/******************************/


/*******  OBJ  FILE READERS *************/

function ObjFileLoader() {


    var _this = this;
    this.loadAsync = function (scene, fileData, fileName, fileSize, progressCallback, finishCallback) {

        var _finishCallback = finishCallback || function () { };
        var _progressCallback = progressCallback || function () { };
        var _scene = scene;


        //Check if loading done 
        var isLoadingDone = function () {
            _progressCallback(i, triangleCount); //run progress if defined
            return done;
        }
        // ----




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
                    if (faceColor !== 0)
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



        //Run on complete
        var complete = function () {

            if (geometry.vertices.length > 0) {

                var mesh = utils.meshFromGeometry(geometry);

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

    }


}


/****************************************/



