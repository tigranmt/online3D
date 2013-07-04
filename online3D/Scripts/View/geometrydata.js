var GeoData = function () {


    var _this = this;
    var precision = Math.pow(10, 4);

    _this.data = {
        meshes: []
    };


    


    var keyfromVertex = function (v) {
        if (v === undefined)
            return;
        return [Math.round(v.x * precision), Math.round(v.y * precision), Math.round(v.z * precision)].join('_');
    }

    var keyfromFace = function (f) {
        if (f === undefined)
            return;
        return [f.a, f.b, f.c].join('_');
    }

    var neigboursOfVertices = function (vertices, excludefaces) {

        var neighbourFaces = [];
        var ex = excludefaces || {};
        var unique = {};

        for (var v = 0; v < vertices.length; v++) {
            var m = _this.data.meshes[0];
            var vertex = vertices[v];
            var key = keyfromVertex(vertex);

            var faces = m.vertex_to_face_map[key];

            var filtered = faces.filter(function (f) {
                var k = keyfromFace(f);
                if (unique[k] === undefined) {
                    unique[k] = "";
                }
                else {
                    return false;
                }
                return (ex[k] === undefined);
            });

            neighbourFaces = neighbourFaces.concat(filtered);
        }


        return neighbourFaces;

    }

    var constructGeoDataFromScene = function () {

        if (!stlscene || !stlscene.graphics || !stlscene.graphics.glScene || !stlscene.graphics.glScene.children)
            throw "scene has to be initialized yet";



        TOOLS.forEachMesh(function (mesh) {

            var singleMesh = {
                meshname: mesh.name,
                vertex_to_face_map: {},
                face_to_vertex_map: {}
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


                //face to vertices map
                var keyf = keyfromFace(face);
                if (!singleMesh.face_to_vertex_map[keyf])
                    singleMesh.face_to_vertex_map[keyf] = [];

                singleMesh.face_to_vertex_map[keyf].push(vertexa);
                singleMesh.face_to_vertex_map[keyf].push(vertexb);
                singleMesh.face_to_vertex_map[keyf].push(vertexc);


            }


            _this.data.meshes.push(singleMesh);
        });

    }


    _this.getVertexKey = function (vertex) {
        return keyfromVertex(vertex);
    }

    _this.getFaceKey = function (face) {
        return keyfromFace(face);
    }

    _this.computeFaceNormal = function (face) {

        var normal = face.normal;
        if (!normal || (normal.x === 0 && normal.y === 0)) {

            var vertices = _this.getVerticesOfFace(face);
            var cb = new THREE.Vector3(), ab = new THREE.Vector3();
            var vA = vertices[0];
            var vB = vertices[1];
            var vC = vertices[2];

            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);
            cb.cross(ab);

            cb.normalize();

            face.normal = cb;
        }

        return face.normal;
    }

    _this.updateVertexInfo = function (meshIndex, originalVertex, newVertex) {
        var meshI = meshIndex || 0;
        var mesh = _this.data.meshes[meshI];

        //vertex to face map update
        var keyOriginal = keyfromVertex(originalVertex);
        if (!mesh.vertex_to_face_map[keyOriginal]) {
            console.log("Not valid vertex " + keyOriginal + " ! Can not find it in internal data");
        }
        else {
            var referedFaces = mesh.vertex_to_face_map[keyOriginal];
            delete mesh.vertex_to_face_map[keyOriginal]; //remove property 
            var keyNew = keyfromVertex(newVertex);
            mesh.vertex_to_face_map[keyNew] = referedFaces; // add new property and assign previos collection
        }
        //----


    }


    _this.rebuild = function () {
        _this.data.meshes = [];
        constructGeoDataFromScene();
    }

  

    _this.getNeigbourFaces = function (vertex, deepness) {

        var totalNeighbours = [];
        var deep = deepness || 1;

        var vertexCollection = [];
        vertexCollection.push(vertex);

        var excludeFaces = {};
        var excludeVertices = {};

        var startkeyvertex = keyfromVertex(vertex);
        vertexCollection.push(vertex);
        excludeVertices[startkeyvertex] = "";


        for (var i = 0; i < deep; i++) {
            var neighbours = neigboursOfVertices(vertexCollection, excludeFaces);
            totalNeighbours = totalNeighbours.concat(neighbours);

            if (deep > 1) {
                vertexCollection = [];
                for (var f = 0; f < neighbours.length; f++) {
                    var face = neighbours[f];

                    excludeFaces[keyfromFace(face)] = "";

                    var vertices = _this.getVerticesOfFace(face);

                    //concat UNIQUE vertices
                    for (var v = 0; v < vertices.length; v++) {
                        var keyvertex = keyfromVertex(vertices[v]);
                        if (excludeVertices[keyvertex] === undefined) {
                            vertexCollection.push(vertices[v]);
                            excludeVertices[keyvertex] = "";
                        }
                       
                    }

                }
            }
        }

        return totalNeighbours;

    }


    _this.getVerticesOfFace = function (face) {

        var key = keyfromFace(face);
        var m = _this.data.meshes[0];
        return m.face_to_vertex_map[key];
    }

    _this.getEdgeVertices = function (facesArray) {


       
        if (!facesArray || facesArray.length === 0) {
            console.log("Not valid array to get vertices from");
        }
        else {
            var vertices = {};
            var stat = {};

            var length = facesArray.length;
            for (var f = 0; f < length; f++) {
                var face = facesArray[f];
                var faceVertices = _this.getVerticesOfFace(face);

                var v0 = faceVertices[0];
                var v1 = faceVertices[1];
                var v2 = faceVertices[2];

                // line 0
                //var line0_key = keyfromVertex(v0) + keyfromVertex(v1);
                var line0_key = face.a + "_" + face.b;
                if (!stat.hasOwnProperty(line0_key)) {
                    line0_key = face.b + "_" + face.a; //inverse and check
                    if (!stat.hasOwnProperty(line0_key)) {
                        stat[line0_key] = {
                            faces: [],
                            lineVertices: []
                        }
                    }

                }
                else {
                    var x = 0;
                }
              

                stat[line0_key].faces.push(face);
                stat[line0_key].lineVertices[0] = v0;
                stat[line0_key].lineVertices[1] = v1;



                // line 1
                //var line1_key = keyfromVertex(v1) + keyfromVertex(v2);
                var line1_key = face.b + "_" + face.c;
                if (!stat.hasOwnProperty(line1_key)) {
                    line1_key = face.c + "_" + face.b;  //inverse and check
                    if (!stat.hasOwnProperty(line1_key)) {
                        stat[line1_key] = {
                            faces: [],
                            lineVertices: []
                        }
                    }

                }

                stat[line1_key].faces.push(face);
                stat[line1_key].lineVertices[0] = v1;
                stat[line1_key].lineVertices[1] = v2;
              

                //line 2
                //var line2_key = keyfromVertex(v2) + keyfromVertex(v0);
                var line2_key = face.c + "_" + face.a;
                if (!stat.hasOwnProperty(line2_key)) {
                    line2_key = face.a + "_" + face.c;  //inverse and check
                    if (!stat.hasOwnProperty(line2_key)) {
                        stat[line2_key] = {
                            faces: [],
                            lineVertices: []
                        }
                    }
                }

                stat[line2_key].faces.push(face);
                stat[line2_key].lineVertices[0] = v2;
                stat[line2_key].lineVertices[1] = v0;
               


            }
        }

        for (var prop in stat) {          
            if (stat.hasOwnProperty(prop)) {
                var trianglesCount = stat[prop].faces.length;
                if (trianglesCount < 2) //this is edge 
                {
                    var vertex0 = stat[prop].lineVertices[0];
                    var vertex1 = stat[prop].lineVertices[1];

                    var key0 = keyfromVertex(vertex0);
                    var key1 = keyfromVertex(vertex1);

                    vertices[key0] = vertex0;
                    vertices[key1] = vertex1;
                }
            }
        }

        return vertices;
    }


    _this.getVerticesOfFaces = function (facesArray) {
        if (!facesArray || facesArray.length === 0) {
            console.log("Not valid array to get vertices from");
        }
        else {
            var vertices = [];
            var unique = {};
            var length = facesArray.length;
            for (var f = 0; f < length; f++) {
                var face = facesArray[f];
                var faceVertices = _this.getVerticesOfFace(face);
                for (var v = 0; v < faceVertices.length; v++) {
                    var vertex = faceVertices[v];
                    var key = keyfromVertex(vertex);

                    //skip this
                    if (unique[key] === "") {
                        continue;
                    }
                    else {
                        unique[key] = "";
                        vertices.push(vertex);
                    }

                }
            }
        }

        return vertices;
    }



    _this.getVertexAvgNormal = function (vertex) {

        var neighbours = _this.getNeigbourFaces(vertex);
        if (!neighbours || neighbours.length === 0)
            return;


        var avgNormal = new THREE.Vector3(0, 0, 0);

        var twoLines = [new THREE.Vector3(), new THREE.Vector3()];
        for (var i = 0; i < neighbours.length; i++) {
            var face = neighbours[i];
            var vertices = _this.getVerticesOfFace(face);
            for (var v = 0; v < vertices.length; v++) {
                var ve = vertices[v];
                if (ve == vertex)
                    continue;

                twoLines[1] = twoLines[0];
                var v0 = vertex;
                var v1 = new THREE.Vector3(ve.x, ve.y, ve.z);
                v1.subVectors(v1, v0);
                twoLines[0] = v1;

            }


            var normal = _this.computeFaceNormal(face);
            if (normal.x === 0 && normal.y === 0)
                normal = geodata.computeFaceNormal(face);

            var angle = twoLines[0].angleTo(twoLines[1]);
            var multiplied = normal.multiplyScalar(angle);
            avgNormal.addVectors(avgNormal, multiplied);
        }


        avgNormal.multiplyScalar(1.0 / neighbours.length);
        return avgNormal;

    }






    constructGeoDataFromScene();
};