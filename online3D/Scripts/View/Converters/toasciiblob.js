/**
* Converts specified mesh into ASCII stl formatted blob
*/
function ToAsciiBlob() {
    this.meshToAsciiBlob = function (mesh) {
        var newline = " \r\n";
        var stringData = "solid WRAP" + newline;
      
        var geom = mesh.geometry;
        var faces = geom.faces;
        for (var i = 0; i < faces.length; i++) {

            var face = faces[i];
            var facenormal = face.normal;

            stringData += "facet normal " + facenormal.x + " " + facenormal.y + " " + facenormal.z + newline;

            stringData += "outer loop" + newline;

            var v0 = geom.vertices[face.a];
            var v1 = geom.vertices[face.b];
            var v2 = geom.vertices[face.c];


            stringData += "vertex " + v0.x + " " + v0.y + " " + v0.z + newline;
            stringData += "vertex " + v1.x + " " + v1.y + " " + v1.z + newline;
            stringData += "vertex " + v2.x + " " + v2.y + " " + v2.z + newline;

            stringData += "endloop" + newline;
            stringData += "endfacet" + newline;
        }

        stringData += "end solid";


        return new Blob([stringData], { type: "text/plain" });
    }

    this.stringToAscciBlob = function(stringData) {
        return new Blob([stringData], { type: "text/plain" });
    }
}