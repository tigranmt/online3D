var utils = new (function () {
    var _this = this;

    


    /*  Gets the current date time in dd/mm/yyyy @ hh:mm:ss
     * 
    */
    _this.getCurrentDateTime = function () {
        var currentdate = new Date();
        var datetime = currentdate.getDate() + "/"
                    + (currentdate.getMonth() + 1) + "/"
                    + currentdate.getFullYear() + " @ "
                    + currentdate.getHours() + ":"
                    + currentdate.getMinutes() + ":"
                    + currentdate.getSeconds();
        return datetime;
    }


  

    /*  Truncates vertex coordinates to #.00 precision
     * 
    */
    _this.vertexToShorten = function(v) {
           //shortify vertex values
          return {
                      x : parseFloat(Math.round(v.x * 100) / 100).toFixed(2), 
                      y : parseFloat(Math.round(v.y * 100) / 100).toFixed(2),
                      z : parseFloat(Math.round(v.z * 100) / 100).toFixed(2)
                 };
    }


   
    /*  Converts THREE.js mesh geometry object to data model object
     *   @param {THREE.Mesh} mesh Mesh object
     */
    _this.meshModelFromMesh = function (mesh) {
        var verticesShort = [];
        var facesArray = [];
        var vertexCollection = mesh.children[0].geometry.vertices;

        for(var i=0;i<vertexCollection.length;i++) {

            var v = vertexCollection[i];
            var vertex = _this.vertexToShorten(v);
         

            verticesShort.push(vertex);

        }


        var faces = mesh.children[0].geometry.faces;
        for (var i = 0; i < faces.length; i++) {

            var f = faces[i];
            facesArray.push(f);

        }

        return  {
                    name     : mesh.name,
                    vertices : verticesShort,
                    faces    : facesArray,
                    color    : mesh.color,
                };
        
    }



    
    /*  Gets session info object from  provided parameters
    *  @param {THREE.Geometry} geometry Creates THREE.Mesh object with predefined material types for specified THREE.Geometry     
    */
    _this.meshFromGeometry = function(geometry) {
        var meshMaterial = new THREE.MeshPhongMaterial({ ambient: 0x222222, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, perPixel: false, overdraw: true, side: THREE.DoubleSide });
        var meshWireframe = new THREE.MeshBasicMaterial({ color: 0x111111, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, wireframe: true });
        var multiMaterial = [meshMaterial, meshWireframe];

        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
                  
        var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, multiMaterial);
        return mesh;
    }

    _this.objectFromMultimaterial = function(object3D) {
        if(object3D.Format === "obj") {
            for(var ch=0;ch<object3D.children.length;ch++){
                var m = object3D.children[ch];
                var geometry = m.geometry;
                var meshMaterial = new THREE.MeshPhongMaterial({ ambient: 0x222222, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, perPixel: false, overdraw: true, side: THREE.DoubleSide });
                var meshWireframe = new THREE.MeshBasicMaterial({ color: 0x111111, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, wireframe: true });
                var multiMaterial = [meshMaterial, meshWireframe];

                geometry.computeFaceNormals();
                geometry.computeVertexNormals();
                  
                var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, multiMaterial);
                
                //substitude with a new one
                object3D.children[ch] = mesh;
            }

            return object3D;
        }
    }


});