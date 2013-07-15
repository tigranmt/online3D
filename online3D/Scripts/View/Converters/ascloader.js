function AscLoader() {

    var _this = this;

    this.loadAsync = function (scene, fileData, fileName, fileSize, progressCallback, finishCallback) {


        var _scene = scene;
        var _finishCallback = finishCallback || function () { };
        var _progressCallback = progressCallback || function () { };

        var geometry = new THREE.Geometry();
        var verticesCount = 0;


        var modelColor = Math.random() * 0xffffff; // random model's faces color

        var done = false;



        fileData = fileData.replace(/\r/, "\n");
        fileData = fileData.replace(/\n/g, " ");        
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
            while (curIndex < pointCount) {

                //skip face normals
                //curIndex += 3;

                var v = new THREE.Vector3(parseFloat(points[curIndex]), parseFloat(points[curIndex + 1]), parseFloat(points[curIndex + 2]));
                geometry.vertices.push(v);           

                curIndex += 3;

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

                geometry.color = modelColor;

                var particleSystem = utils.particleSystemFromGeometry(geometry);

                //set additional mesh data
                particleSystem.name = fileName;
                particleSystem.facecount = geometry.faces.length;
                particleSystem.verticescount = geometry.vertices.length;
                particleSystem.filesize = Math.round((fileSize / 1024) * 100) / 100;
                particleSystem.color = modelColor;
                particleSystem.Format = "asc";
                _scene.add(particleSystem); //add to scene
            }

            _finishCallback();
        }


        async.until(isLoadingDone, readStep, complete);

    }

}