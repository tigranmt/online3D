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


    //Converts THREE.js mesh geometry object to data model object
    _this.meshModelFromMesh = function (mesh) {
        return  {
                    name     : mesh.name,
                    vertices : mesh.children[0].geometry.vertices,
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