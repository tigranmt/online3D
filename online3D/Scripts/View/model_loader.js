
function ModelLoader(scene, camera, renderer, tracker) {
    var glScene = scene;
    var glCamera = camera;
    var glRender = renderer;
    var sceneTracker = tracker;

    var _this = this;


    var progress = function (current, total) {

        if (_this._progressIndicator === undefined) {
            _this._progressIndicator = $("#progress").percentageLoader({ width: 130, height: 130, progress: 0.1, onProgressUpdate: function (val) {
                _this._progressIndicator.setValue(Math.round(val * 100.0));
            }
            });
        }

        $("#progress").show();
        var value = current / total;
        _this._progressIndicator.setProgress(value);

        var procent = Math.floor(value * 100);
        _this._progressIndicator.setValue(procent.toString() + '%');

        if (procent === 100) {
            _this._progressIndicator.hide();
        }
    }

    //main method that loads STL models
    this.loadModel = function (scene, data, fileName, fileSize, nextCallback) {


        if (!fileName || !fileSize) {
            toastr.error('Can not load file', 'Error');
            return;
        }

       
        var extension = fileName.split('.').pop().toUpperCase();
        var modelToMesh = new ModelToMesh(extension);
        modelToMesh.loadModelAsync(scene, data, fileName, fileSize, progress, nextCallback);
        
    }

    //Loads the session JSON file informazion on screen (not only meshes, but notes, colors...)
    this.loadSession = function (scene, data, fileName, fileSize, nextCallback) {
        new SessionToMeshes().loadSessionAsync(scene, data, progress, nextCallback);
    }



    //Loads meshy model, whis is sequence of vertices from the server
    this.loadMeshModel = function (object, nextCallback) {
        if (object === undefined || object.Size === undefined) {
            toastr.error('Can not load mesh', 'Error');
            return;
        }

        if (object.Format.toUpperCase() === "STL") {
            new VertexToMesh().loadAsync(scene, object, progress, nextCallback);
        }
        else
            throw 'Not recognized file format';
    }


   


    

}


