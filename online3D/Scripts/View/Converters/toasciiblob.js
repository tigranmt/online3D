/**
* Converts specified mesh into ASCII stl formatted blob
*/
function ToAsciiBlob() {
    this.meshToAsciiBlob = function (mesh) {
        var newline = " \r\n";
        var stringData = "solid WRAP" + newline;
        var faceindex = 0;
        var geom = mesh.geometry;
        for (var i = 0; i < geom.vertices.length; i += 3) {
            var face = geom.faces[faceindex];
            var facenormal = face.normal;
            stringData += "facet normal " + facenormal.x + " " + facenormal.y + " " + facenormal.z + newline;

            stringData += "outer loop" + newline;

            var v0 = geom.vertices[i];
            var v1 = geom.vertices[i + 1];
            var v2 = geom.vertices[i + 2];


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