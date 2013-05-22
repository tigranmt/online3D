var utils = new (function () {
    var _this = this;


    _this.getCurrentDateTime = function () {
        var currentdate = new Date();
        var datetime = "Last Sync: " + currentdate.getDate() + "/"
                    + (currentdate.getMonth() + 1) + "/"
                    + currentdate.getFullYear() + " @ "
                    + currentdate.getHours() + ":"
                    + currentdate.getMinutes() + ":"
                    + currentdate.getSeconds();
    }


    //truncates vertex coordinates to #.00 precision
    _this.vertexToShorten = function(v) {
           //shortify vertex values
          return {
                      x : parseFloat(Math.round(v.x * 100) / 100).toFixed(2), 
                      y : parseFloat(Math.round(v.y * 100) / 100).toFixed(2),
                      z : parseFloat(Math.round(v.z * 100) / 100).toFixed(2)
                 };
    }


    //Converts THREE.js mesh geometry object to data model object
    _this.meshModelFromMesh = function (mesh) {
        var verticesShort = [];
        var vertexCollection = mesh.children[0].geometry.vertices;
        for(var i=0;i<vertexCollection.length;i++) {

            var v = vertexCollection[i];
            var vertex = _this.vertexToShorten(v);
         

            verticesShort.push(vertex);

        }
        return  {
                    name     : mesh.name,
                    vertices : verticesShort,
                    color    : mesh.color,
                };
        
    }


    _this.getSessionManifest = function(sessionName, emails) {
        return {
                SessionName: sessionName, 
                Emails: emails, 
                Date: new Date().getDate(), //cur date
                Meshes: [],
                Notes : [], 
            };
    }
}
);