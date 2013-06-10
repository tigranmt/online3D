var GeoData = function () {


    var _this = this;
    var precision = Math.pow(10, 2);

    _this.data = {
         meshes : []
    };


    var keyfromVertex = function (v) {
        if (v === undefined)
            return;
        return [Math.round(v.x * precision), Math.round(v.y * precision), Math.round(v.z * precision)].join('_');
    }


    _this.neigbourInRecursion = function (vertex, deepness) {
            
    }

    _this.getNeigbourFaces = function (vertex, deepness) {

        //var d = deepness || 1;
        var m = _this.data.meshes[0];
        var key = keyfromVertex(vertex);

        //var total = [];
        //var edges = [];

        //for (var level = 0; level < d; level++) {
        //    var key = keyfromVertex(vertex);
        //    edges.concat(m.vertex_to_face_map[key]);
        //}


        return m.vertex_to_face_map[key];
    }



    var constructGeoDataFromScene = function () {

        if (!stlscene || !stlscene.graphics || !stlscene.graphics.glScene || !stlscene.graphics.glScene.children)
            throw "scene has to be initialized yet";

      

        TOOLS.forEachMesh(function (mesh) {

            var singleMesh =  {
                meshname : mesh.name, 
                vertex_to_face_map : {}
            };

            var geometry = mesh.children[0].geometry;
            var faces = geometry.faces;
            var vertices = geometry.vertices;
            for (var f = 0; f < faces.length; f++) {
                var face = faces[f];

                var vertexa = vertices[face.a];
                var vertexb = vertices[face.b];
                var vertexc = vertices[face.c];

                //a vertex
                var keya = keyfromVertex(vertexa);
                if (!singleMesh.vertex_to_face_map[keya]) {
                    singleMesh.vertex_to_face_map[keya] = [];
                }
                else {

                    var x = 0;
                    x++;
                }
                singleMesh.vertex_to_face_map[keya].push(face);

                //b vertex 
                var keyb = keyfromVertex(vertexb);
                if (!singleMesh.vertex_to_face_map[keyb]) {
                    singleMesh.vertex_to_face_map[keyb] = [];
                }
                singleMesh.vertex_to_face_map[keyb].push(face);


                //c vertex
                var keyc = keyfromVertex(vertexc);
                if (!singleMesh.vertex_to_face_map[keyc]) {
                    singleMesh.vertex_to_face_map[keyc] = [];
                }
                singleMesh.vertex_to_face_map[keyc].push(face);

            }
            

            _this.data.meshes.push(singleMesh);
        });

    }
    



    constructGeoDataFromScene(); 
};