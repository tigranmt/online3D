///
function SessionToMeshes() {


    /*loads geometry informationfrom the session
    * Loads session complete information in async calls
    * 
    */
    this.loadSessionAsync = function (scene, data, progress, nextCallback) {


        var isDone = false;
        var sessionObj = data; 

        var currentModelIndex = 0;
        var currentVertexIndex = 0;
        var stepSize = 900; //vertices per iteration
        var totalModelsCount = sessionObj.Meshes.length;
        var curMesh = sessionObj.Meshes[currentModelIndex];
        var vertexCount = curMesh.vertices.length;
        var progressCallback = progress;

        var geometries = [];

        var curGeometry = new THREE.Geometry();
        curGeometry.name = curMesh.name;



        var modelColor = curMesh.color || Math.random() * 0xffffff;
        curGeometry.color = modelColor;

        var readStep = function (iterator) {


            while (currentVertexIndex < vertexCount) {

                for (var i = currentVertexIndex; i < currentVertexIndex + 3; i++) {
                    var ob = curMesh.vertices[i];

                    var vertex = new THREE.Vector3(ob.x, ob.y, ob.z);
                    curGeometry.vertices.push(vertex);
                }

                currentVertexIndex = i;


                //add face of 3 vertices
                //var length = geometry.vertices.length;
                var length = currentVertexIndex;
                var face = new THREE.Face3(length - 3, length - 2, length - 1, 1);
                face.color.setHex(modelColor);
                curGeometry.faces.push(face);



                //single step break conditon 
                if (currentVertexIndex % stepSize === 0) {
                    break;
                }

            } // while



            //check if we finished with the current model (loaded all vertces of it
            if (currentVertexIndex === vertexCount) {

                //increment model index
                currentModelIndex++;

                //push filled with data geometry to array
                geometries.push(curGeometry);

                //reset current geometry
                curGeometry = new THREE.Geometry();



                //chekc if there is any other model in array to load
                if (currentModelIndex < totalModelsCount) {
                    curMesh = sessionObj.Meshes[currentModelIndex];

                    //set new vertex count
                    vertexCount = curMesh.vertices.length;

                    //set name 
                    curGeometry.name = curMesh.name;

                    //set color                   
                    modelColor = curMesh.color || Math.random() * 0xffffff;


                    //reset current vertex index
                    currentVertexIndex = 0;

                }
            }

            //check if we finished all models
            if (currentModelIndex === totalModelsCount) {
                progressCallback(currentVertexIndex, vertexCount);
                isDone = true;
            }


            iterator();
        }


        var isLoadingDone = function () {
            progressCallback(currentVertexIndex, vertexCount);
            return isDone;
        }

        var complete = function () {

            for (var g = 0; g < geometries.length; g++) {

                var geometry = geometries[g];

                geometry.mergeVertices();
                geometry.computeCentroids();
                geometry.computeVertexNormals();
                geometry.computeFaceNormals();
                geometry.computeBoundingSphere();

                //construct mesh
                var mesh = utils.meshFromGeometry(geometry);

                //set additional mesh data
                mesh.name = geometry.name;
                mesh.facecount = geometry.faces.length;
                mesh.verticescount = geometry.vertices.length;
                mesh.filesize = 0;
                mesh.color = geometry.color;
                scene.add(mesh); //add to scene
            }

            nextCallback();
        }





        async.until(isLoadingDone, readStep, complete); //async call 
    }

}