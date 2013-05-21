///
function SessionToMeshes() {


    //loads geometry informationfrom the session
    this.loadSessionAsync = function (scene, data, progress, nextCallback) {


        var isDone = false; 
        var sessionObj = JSON.parse(data); //parse to object from JSON 

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

        var readStep = function (iterator)
        {

           
            while (currentVertexIndex < vertexCount) {

                for (var i = currentVertexIndex; i < currentVertexIndex + 3; i++) {
                    var ob = curMesh.vertices[i]; 
                    var vertex = new THREE.Vector3(ob.x, ob.y, ob.z);
                    curGeometry.vertices.push(vertex);
                }

                currentVertexIndex += 3;

                //single step break conditon 
                if (currentVertexIndex % stepSize === 0) {
                    break;
                }

                //add face of 3 vertices
                //var length = geometry.vertices.length;
                var length = currentVertexIndex;
                var face = new THREE.Face3(length - 3, length - 2, length - 1, 1);
                face.color.setHex(modelColor);
                curGeometry.faces.push(face);

            } // while



            //check if we finished with the current model (loaded all vertces of it
            if (currentVertexIndex === vertexCount) {

                //increment model index
                currentModelIndex++;

                //push filled with data geometry to array
                geometries.push(curGeometry);

                //reset current geometry
                curGeometry = new THREE.Geometry();

                //generate new color
                modelColor = curMesh.color || Math.random() * 0xffffff;

                //chekc if there is any other model in array to load
                if (currentModelIndex < totalModelsCount)
                    curMesh = sessionObj.Meshes[currentModelIndex];
            }

            //check if we finished all models
            if (currentModelIndex >= totalModelsCount) {
                isDone = true;
            }
          

            iterator();
        }


        var isLoadingDone = function () {
            progressCallback(currentVertexIndex, vertexCount);
            return isDone;
        }

        var complete = function ()
        {

            for (var g = 0; g<geometries.length; g++) {
                //consruct mesh
                var geometry = geometries[g];
                var meshMaterial = new THREE.MeshPhongMaterial({ ambient: 0x222222, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, perPixel: false, overdraw: false, side: THREE.DoubleSide });
                var meshWireframe = new THREE.MeshBasicMaterial({ color: 0x111111, vertexColors: THREE.FaceColor, wireframe: true });
                var multiMaterial = [meshMaterial, meshWireframe];

                //normals calculation for correct lighting
                geometry.computeFaceNormals();
                geometry.computeVertexNormals();

                //   geometry.__dirtyColors = true;
                var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, multiMaterial);

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