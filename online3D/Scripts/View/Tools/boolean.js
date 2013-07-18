TOOLS.Boolean = function () {

    var _this = this;  

    this.title = "Boolean";
    this.text = "Choose 2 models to execute boolean over";
   

    this.uiWidth = 300;

    this.htmlUI = (function () {

        var models = viewmodels.modelsInformation(); //ko.observable

        var html = "<label>Select first model</label>";
        html += "<select id = 'firstModel'>";

        for (var i = 0; i < models.length; i++) {
            var modelInfo = models[i];

            html += "<option value = " + i + ">" + modelInfo.fileName + "</option>";
        }

        html += "</select>";


        html += "<label>Select second model</label>";
        html += "<select id = 'secondModel'>";

        for (var i = 0; i < models.length; i++) {
            var modelInfo = models[i];

            html += "<option value = " + i + ">" + modelInfo.fileName + "</option>";
        }

        html += "</select>";

        html += "<div class='btn-group'>" +
                   "<button id='substruct' class='btn'>Substruct</button>" +
                   "<button id='union' class='btn'>Union</button>" +
                     "<button id='intersect' class='btn'>Intersect</button>" +
                   "</div>";

      
        html += "<i id='spinnerBoolean' class='icon-spinner icon-spin icon-2x' style='left: 10px; top: 5px; position: relative; visibility:hidden '></i>";

        return html;
    })();


    var showSpinner = function (callme) {
        $("#spinnerBoolean").css("visibility", "visible");
       
        setTimeout(callme, 10);
    }

    var hideSpinner = function () {
        $("#spinnerBoolean").css("visibility", "hidden");
    }

    //Populates faceVertexUvs array, needs for boolean operation
    var prepareGeometryForBoolean = function (geometry) {

        for (var f = 0; f < geometry.faces.length; f++) {

            var face = geometry.faces[f];
            var va = geometry.vertices[face.a];
            var vb = geometry.vertices[face.b];
            var vc = geometry.vertices[face.c];
            geometry.faceVertexUvs[0].push(
                [
					new THREE.Vector2(va.x, va.y),
					new THREE.Vector2(vb.x, vb.y),
					new THREE.Vector2(vc.x, vc.y)
                ]
            );
        }

    }


    
    //PREPARE BSP MODELS FOR BOOLEAN OPERATION
    var startBoolean = function () {



        var firstName = $('#firstModel').find(":selected").text();
        var secondName = $('#secondModel').find(":selected").text();

        //no any name selected on UI, or the name is the same 
        if (!firstName || !secondName || firstName === secondName)
            return [];


        var firstMesh = TOOLS.getModelsByName(firstName)[0];
        var secondMesh = TOOLS.getModelsByName(secondName)[0];


        //no any valid mesh object found with given names
        if (!firstMesh || !secondMesh)
            return [];

        var geoFirst = TOOLS.getGeometry(firstMesh);
        prepareGeometryForBoolean(geoFirst);

        var geoSecond = TOOLS.getGeometry(secondMesh);
        prepareGeometryForBoolean(geoSecond);

        var firstBSP = new ThreeBSP(geoFirst);
        var secondBSP = new ThreeBSP(geoSecond);


        //reset geometris UV collections, as till now we need them ONLY for boolean operations
        geoFirst.faceVertexUvs[0] = [];
        geoSecond.faceVertexUvs[0] = [];

        firstBSP.name = firstName;
        secondBSP.name = secondName;


        return [firstBSP, secondBSP];
    }


    //FINALIZING BOOLEAN OPERATION RESULT PROCESSING
    var finishBoolean = function( resultBSP) {
        var materialNormal = new THREE.MeshNormalMaterial();
        var booleanMesh = resultBSP.toMesh(materialNormal); //GET MESH MODEL 

     
        var newMesh = utils.meshFromGeometry(booleanMesh.geometry); //GENERATE NEW MESH FOR ONLINE3D SCENE

        newMesh.name = resultBSP.name;
        newMesh.facecount = booleanMesh.geometry.faces.length;
        newMesh.verticescount = booleanMesh.geometry.vertices.length;
        newMesh.filesize = "0";
        newMesh.Format = "stl";

        TOOLS.addMesh(newMesh);
        utils.sceneGeometryChanged();

        hideSpinner();
    }
   

    //SUBSTRUCTION
    var substruct = function () {

        var meshCouple = startBoolean();
        if (!meshCouple || meshCouple.length !== 2) {
            hideSpinner();
            return;
        }

        var substructBSP = meshCouple[0].subtract(meshCouple[1]); //SUBSTRUCT    
        substructBSP.name = meshCouple[0].name + "-" + meshCouple[1].name;

        finishBoolean(substructBSP);

    }


    //UNION
    var union = function () {
        var meshCouple = startBoolean();
        if (!meshCouple || meshCouple.length !== 2) {
            hideSpinner();
            return;
        }

        var unionBSP = meshCouple[0].union(meshCouple[1]); //UNION    

        unionBSP.name = meshCouple[0].name + "+" + meshCouple[1].name;

        finishBoolean(unionBSP);
    }

    //INTERSECTION
    var intersect = function () {
        var meshCouple = startBoolean();
        if (!meshCouple || meshCouple.length !== 2) {
            hideSpinner();
            return;
        }

        var intersectBSP = meshCouple[0].intersect(meshCouple[1]); //INTERSECT    
        

        intersectBSP.name = meshCouple[0].name + "x" + meshCouple[1].name;

        finishBoolean(intersectBSP);
    }


    this.start = function () {

        /**Subscribing to the mai bollean buttons action**/


        console.log("Start sculpturing");
      
        TOOLS.current = _this;

        $("#substruct").on('click', function (event) {
            showSpinner(substruct);
            
        });


        $("#union").on('click', function (event) {
            showSpinner(union);            
        });

        $("#intersect").on('click', function (event) {
            showSpinner(intersect);            
        });
    };

    this.startAgent = function () {
        console.log("No agent call for " + this.title + " expected");
    };



    this.stop = function () {
        console.log("Stop boolean");
      
    };


   
};


//Point to point measurer
TOOLS.Boolean.prototype = TOOLS;
TOOLS.Boolean.prototype.constructor = TOOLS.Tool(TOOLS.BOOLEAN);