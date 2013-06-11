var GeoData = function () {


    var _this = this;
    var precision = Math.pow(10, 4);

    _this.data = {
         meshes : []
    };

  

    var keyfromVertex = function (v) {
        if (v === undefined)
            return;
        return [Math.round(v.x * precision), Math.round(v.y * precision), Math.round(v.z * precision)].join('_');
    }

    var keyfromFace = function(f) {
        if (f === undefined)
            return;
        return [f.a, f.b, f.c].join('_');
    }

    var neigboursOfVertices = function (vertices, excludefaces) {

        var neighbourFaces = [];
        var ex = excludefaces || {};

        for (var v = 0; v < vertices.length; v++) {
            var m = _this.data.meshes[0];
            var vertex = vertices[v];
            var key = keyfromVertex(vertex);

            var faces = m.vertex_to_face_map[key];

            var filtered = faces.filter(function (f) {
                var k = keyfromFace(f); 
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


    var computeFaceNormal = function (face) {
      
        var vertices = _this.getVerticesOfFace(face);
        var cb = new THREE.Vector3(), ab = new THREE.Vector3();
        var vA = vertices[0];
        var vB = vertices[1];
        var vC = vertices[2];

        cb.subVectors(vC, vB);
        ab.subVectors(vA, vB);
        cb.cross(ab);

        cb.normalize();

        return cb;
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
                        var keyvertex= keyfromVertex(vertices[v]); 
                        if (excludeVertices[keyvertex] === undefined) {
                            vertexCollection.push(vertices[v]);
                            excludeVertices[keyvertex] = "";
                        }
                        else {

                            var x = 0;
                            x++;
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
                var v0 = new THREE.Vector3(ve.x, ve.y, ve.z);
                var v1 = new THREE.Vector3(ve.x, ve.y, ve.z);
                v1.addVectors(v1, v0);
                twoLines[0] = v1;

            }


            var normal =  computeFaceNormal(face);
            var angle = twoLines[0].angleTo(twoLines[1]);
            var multiplied = normal.multiplyScalar(angle);                
            avgNormal.addVectors(avgNormal, multiplied);
        }


        avgNormal.multiplyScalar(1.0 / neighbours.length);
        return avgNormal;

    //    CoreTriangleCollection triangles = this.GetConnectedTrianglesReference(cmc);
    //    Vector3 averageNormal = new Vector3(0, 0, 0);
    //    int thisNr;
    //    Vector3[] twoLines = new Vector3[2];
    //    bool success;

    //    foreach (CoreTriangle triangle in triangles)
    //{
    //            thisNr = triangle.GetVertexNr(this);
    //    for (int i = 0; i < 3; ++i)
    //    {
    //        if (i != thisNr)
    //        {
    //            twoLines[1] = twoLines[0];
    //            twoLines[0] = new Vector3(triangle._vertices[i].Coord, triangle._vertices[thisNr].Coord);
    //        }
    //    }
    //    averageNormal += twoLines[0].AngleWith(twoLines[1]) * triangle.GetCoord().GetNormal(out success);
    //}
    //averageNormal.Scale(1.0f / (double)triangles.Count);
    //return averageNormal;




        //var neighbours = _this.getNeigbourFaces(vertex);
        //if (!neighbours || neighbours.length === 0)
        //    return;

        //var avgNormal = new THREE.Vector3(0, 0, 0);

        //for (var n = 0; n < neighbours.length; n++) {

        //    var ne = neighbours[n];
        //    var normal = computeFaceNormal(ne);
          
        //    avgNormal.addVectors(avgNormal, normal);

        //}


        //avgNormal.multiplyScalar(1.0 / neighbours.length);
        //return avgNormal;
    }

   

  


    constructGeoDataFromScene(); 
};