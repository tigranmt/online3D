/*****
Converts Vertex array  to Three.js mesh and adds it to a scene
Dependency async.js
**/
function VertexToMesh() {

    var getVertexCountInPacket = function (vertexCount) {
        if (vertexCount >= 100000)
            return 3000;
        else if (vertexCount >= 40000)
            return 1500;
        else if (vertexCount >= 10000)
            return 1200;
        else if (vertexCount >= 3000)
            return 900;

        return 3;
    }


    /** Loads mesh (object) and accepts next call (callback) procedure **/
    this.loadAsync = function (scene, object, progressCallback, finishCallback) {

        var _scene = scene;
        var _finishCallback = finishCallback || function () { };
        var _progressCallback = progressCallback || function () { };
        var _this = this;
        var done = false;

        var geometry = new THREE.Geometry();
        var modelColor = object.Color;
        var vertices = object.Vertices;
        var i = 0;
        var allVerticesCount = vertices.length;

        //single step runner
        var readStep = function (iterator) {
            //just define a step of 1/1000 of the quantity of triangles in the mesh
            var index = parseInt(getVertexCountInPacket(allVerticesCount));
            var verticesCount = 0;

            if (i === allVerticesCount) {
                done = true;
            }
            else {

                while (index > 0 && i < allVerticesCount) {

                    geometry.vertices.push(vertices[i]);
                    verticesCount++;

                    //this is triangle, so create a new face
                    if (verticesCount == 3) {
                        var length = geometry.vertices.length;
                        var face = new THREE.Face3(length - 3, length - 2, length - 1, 1);

                        geometry.faces.push(face);
                        verticesCount = 0;
                    }

                    index--;
                    i++;
                }
            }

            iterator();
        }
        //----



        //Check if loading done 
        var isLoadingDone = function () {
            _progressCallback(i, allVerticesCount); //run progress if defined
            return done;
        }
        // ----


        //Run on complete
        var complete = function () {
            //vertices are loaded 
            if (geometry.vertices.length > 0) {

                geometry.color = modelColor;
                var mesh = utils.meshFromGeometry(geometry);


                //set additional mesh data
                mesh.name = object.ModelName;
                mesh.facecount = geometry.faces.length;
                mesh.verticescount = geometry.vertices.length;
                mesh.filesize = object.Size;
                mesh.color = modelColor;
                _scene.add(mesh); //add to scene


                _finishCallback();

            }
        }
        // ------ 




        async.until(isLoadingDone, readStep, complete);

    }
}