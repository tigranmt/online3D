var utils = new (function () {
    var _this = this;


    var fragmentShader  = "precision mediump float; " + 
    "uniform vec3 color, centerPicking;" +  
    "uniform float radiusSquared; " + 
    "varying vec3 vVertex, vNormal;" + 
    "const vec3 colorBackface = vec3(0.81, 0.71, 0.23);" + 
    "const vec3 vecLight = vec3(0.06189844605901729, 0.12379689211803457, 0.9903751369442766);" + 
    "const float shininess = 100.0;" + 
    "void main()" + 
    "{" + 
        "vec3 normal;" + 
        "vec3 fragColor;" + 
        "if(gl_FrontFacing)" + 
        "{" + 
           " normal = vNormal;" + 
            "fragColor = color;" + 
        "}" + 
        "else" + 
        "{" + 
            "normal = -vNormal;" + 
            "fragColor = colorBackface;" + 
        "}" + 
        "float dotLN = dot(normal, vecLight);" + 
        "vec3 vecR = normalize(2.0 * dotLN * normal - vecLight);" + 
        "float dotRVpow = pow(dot(vecR, vecLight), shininess);" + 
        "vec3 ambiant = fragColor * 0.5;" + 
        "vec3 diffuse = fragColor * 0.5 * max(0.0, dotLN);" + 
        "vec3 specular = fragColor * 0.8 * max(0.0, dotRVpow);" + 
        "fragColor = ambiant + diffuse + specular;" + 
        "vec3 vecDistance = vVertex - centerPicking;" + 
        "float dotSquared = dot(vecDistance, vecDistance);" + 
        "if(dotSquared < radiusSquared * 1.06 && dotSquared > radiusSquared * 0.94)" + 
            "fragColor *= 0.5;" + 
        "else if(dotSquared < radiusSquared)" + 
            "fragColor *= 1.1;" + 
        "gl_FragColor = vec4(fragColor, 1.0);"+ 
    "}";


    var vertexShader = "attribute vec3 vertex, normal; " +
            "uniform mat4 mvMat, mvpMat;" +
            "uniform mat3 nMat;" +
            "varying vec3 vVertex, vNormal;" +
            "varying vec2 vTexCoord;" +
            "void main()" +
            "{" +
                "vec4 vertex4 = vec4(vertex, 1.0);" +
                "vNormal = nMat * normal;" +
                "vVertex = vec3(mvMat * vertex4);" +
                "gl_Position = mvpMat * vertex4;" +
            "}";


    //var uniforms = {
    //    color: { type: 'vec3', value: new THREE.Vector3(0, 0, 0) },
    //    centerPicking: { type: 'vec3', value: new THREE.Vector3(0, 0, 0) },
    //    radiusSquared: { type: 'f', value: 1.0 } 
    //};


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



    _this.sceneGeometryChanged = function () {

        $.geoData.rebuild();
        stlscene.graphics.loadMeshesInformation();
    }


    /*  Truncates vertex coordinates to #.00 precision
    * 
    */
    _this.vertexToShorten = function (v) {
        //shortify vertex values
        var shorten = {
            x: parseFloat(Math.round(v.x * 100) / 100).toFixed(2),
            y: parseFloat(Math.round(v.y * 100) / 100).toFixed(2),
            z: parseFloat(Math.round(v.z * 100) / 100).toFixed(2)
        };

        //assign color
        if (v.vertexColor) {
            shorten.c = v.vertexColor;
        }

        return shorten;
    }


  
    /*  Converts THREE.js mesh geometry object to data model object
    *   @param {THREE.Mesh} mesh Mesh object
    */
    _this.meshModelFromMesh = function (mesh) {
        var verticesShort = [];
        //var facesArray = [];
        var geometry = mesh.children[0].geometry;

        var faces = geometry.faces;
        for (var i = 0; i < faces.length; i++) {

            var f = faces[i];

            var vertexa = geometry.vertices[f.a];
            var vertexb = geometry.vertices[f.b];
            var vertexc = geometry.vertices[f.c];

            var va = _this.vertexToShorten(vertexa);
            verticesShort.push(va);

            var vb = _this.vertexToShorten(vertexb);
            verticesShort.push(vb);

            var vc = _this.vertexToShorten(vertexc);
            verticesShort.push(vc);
        }

        return {
            name: mesh.name,
            vertices: verticesShort,
            color: mesh.color
        };

    }


    _this.isElementClicked = function (event, elementName) {
        var sourceName = (event.srcElement) ? event.srcElement.localName.toLowerCase() : event.originalTarget.localName.toLowerCase();
        return sourceName === elementName;
    }

    /*  Gets THREE.ParticleSystem
  *  @param {THREE.Geometry} geometry Creates THREE.Mesh object with predefined material types for specified THREE.Geometry     
  */
    _this.particleSystemFromGeometry = function (geometry) {

        var pMaterial = new THREE.ParticleBasicMaterial({ color: 0x111111, size: 0.2 });

        geometry.computeCentroids();
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();

        var particleSystem = new THREE.ParticleSystem(geometry, pMaterial);
      
        return particleSystem;
    }


    


    /*  Gets session info object from  provided parameters
    *  @param {THREE.Geometry} geometry Creates THREE.Mesh object with predefined material types for specified THREE.Geometry     
    */
    _this.meshFromGeometry = function (geometry) {
        var meshMaterial = new THREE.MeshPhongMaterial({ ambient: 0x222222, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, perPixel: false, overdraw: true, side: THREE.DoubleSide });

        //var meshMaterial = new THREE.ShaderMaterial({
        //    fragmentShader: fragmentShader,
        //    //vertexShader: vertexShader,
        //    uniforms: uniforms,
        //    lights: true
        //});
        var meshWireframe = new THREE.MeshBasicMaterial({ color: 0x111111, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, wireframe: true });
        var multiMaterial = [meshMaterial, meshWireframe];

       

        geometry.mergeVertices();
        geometry.computeCentroids();
        geometry.computeFaceNormals();
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();


        _this.setColorsOnModel(geometry);

        var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, multiMaterial);
        return mesh;
    }

    _this.objectFromMultimaterial = function (object3D) {
        if (object3D.Format === "obj") {
            for (var ch = 0; ch < object3D.children.length; ch++) {
                var m = object3D.children[ch];
                var geometry = m.geometry;
                var meshMaterial = new THREE.MeshPhongMaterial({ ambient: 0x222222, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, perPixel: false, overdraw: true, side: THREE.DoubleSide });
                var meshWireframe = new THREE.MeshBasicMaterial({ color: 0x111111, vertexColors: THREE.FaceColors, specular: 0x49D8FB, shininess: 140, wireframe: true });
                var multiMaterial = [meshMaterial, meshWireframe];

                geometry.mergeVertices();
                geometry.computeCentroids();
                geometry.computeFaceNormals();
                geometry.computeVertexNormals();
                geometry.computeBoundingSphere();


              

                _this.setColorsOnModel(geometry);


                var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, multiMaterial);

                //substitude with a new one
                object3D.children[ch] = mesh;
            }

            return object3D;
        }
    }


    /*  Colors faces of geometry according to the available information on colors of geometry vertices
    *  @param {THREE.Geometry} geometry Colors geometry according to the information present in its vertices, if any     
    */
    _this.setColorsOnModel = function (geometry) {
        var faces = geometry.faces;
        var vertices = geometry.vertices;
        for (var f = 0; f < faces.length; f++) {
            var face = faces[f];
            var vertexa = vertices[face.a];
            var vertexb = vertices[face.b];
            var vertexc = vertices[face.c];

            if (vertexa.vertexColor && vertexb.vertexColor && vertexc.vertexColor) {
                face.color.set(vertexa.vertexColor);
            }
            else {
                face.color.set(geometry.color);
            }
        }

        geometry.colorsNeedUpdate = true;
    }


});