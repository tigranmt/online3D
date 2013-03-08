var MenuItem = function (id, text, callback) {
    var self = this;
    self.id = id;
    self.text = text;
    self.callback = callback;
    self.itemVisible = ko.computed(function () {
        if (self.id === "logOutButton" ||
               self.id === "viewSavedModelsButton" ||
               self.id === "shareButton") {
            return userAccess.logedIn();
        }
        else if (self.id === "logInButton") {
            return !userAccess.logedIn();
        }
        else {
            return true;
        }
    });
};

var viewmodels = new (function () {
    var _this = this;




    _this.buttons = [{ id: "tvBtn", alt: "Top view", src: "/Content/Images/tvs.png", callback: function () { stlscene.graphics.topView(); } },
                                { id: "bvBtn", alt: "Bottom view", src: "/Content/Images/bvs.png", callback: function () { stlscene.graphics.bottomView(); } },
                                { id: "lvBtn", alt: "Left view", src: "/Content/Images/lvs.png", callback: function () { stlscene.graphics.leftView(); } },
                                { id: "rvBtn", alt: "Right view", src: "/Content/Images/rvs.png", callback: function () { stlscene.graphics.rightView(); } },
                                { id: "fvBtn", alt: "Front view", src: "/Content/Images/fvs.png", callback: function () { stlscene.graphics.frontView(); } },
                                { id: "bvBtn", alt: "Back view", src: "/Content/Images/backvs.png", callback: function () { stlscene.graphics.backView(); } },
                                { id: "solidBtn", alt: "Solid view", src: "/Content/Images/solids.png", callback: function () { stlscene.graphics.solidView(); } },
                                { id: "wireFrameBtn", alt: "Wireframe view", src: "/Content/Images/wireframes.png", callback: function () { stlscene.graphics.wireframeView(); } },
                                { id: "meshBtn", alt: "Mesh view", src: "/Content/Images/meshs.png", callback: function () { stlscene.graphics.meshView(); } },
                                { id: "axisBtn", alt: "Show axis", src: "/Content/Images/axis.png", callback: function () { stlscene.graphics.showAxis(); } }];




    _this.gotoHome = function (event) {

        var home = window.location.href.split('/');
        window.open(home[0] + "//" + home[2]);
    }


    var logInCallback = function () {
        userAccess.requestUserAuth();
    };

    var viewSavedModelsCallback = function () {
        userAccess.loadUserSavedModels();
    };

    var shareCallback = function () {
        stlscene.graphics.sendContentToServer();
    };

    var logOutCallback = function () {
        userAccess.logOut();
    };

    _this.access_menu = [new MenuItem("logInButton", "Log In", logInCallback),
                          new MenuItem("viewSavedModelsButton", "View saved models", viewSavedModelsCallback),
                          new MenuItem("shareButton", "Share", shareCallback),
                          new MenuItem("logOutButton", "Log out", logOutCallback), ];

    _this.save_menu = [{ id: "saveButton", text: "Screenshot", callback: function () { stlscene.graphics.takeScreenshot(true); } }];


    _this.view_menu = [{ id: "soldViewButton", text: "Solid", callback: function () { stlscene.graphics.solidView(); } },
                            { id: "wireframeViewButton", text: "Wireframe", callback: function () { stlscene.graphics.wireframeView(); } },
                            { id: "meshViewButton", text: "Mesh", callback: function () { stlscene.graphics.meshView(); } },
                            { id: "pointViewButton", text: "Point cloud", callback: function () { /*point cloud clicked*/ } }];


    _this.tools_menu = [{ id: "ppMeasure", text: "Mesure point to point", callback: function () { TOOLS.startTool(TOOLS.POINT_TO_POINT_MEASURER); } },
                          { id: "ppMeshPencil", text: "Mesh pencil", callback: function () { TOOLS.startTool(TOOLS.MESH_PENCIL); } }];
}
);


var note = function (note, index, coord) {
    var _this = this;

    _this.closeButtonHtml = "";
    _this.text = note;
    _this.shortDescription = note.substring(0, 10) + "...";
    _this.vertex = coord;
    _this.noteIndex = index;
    _this.collapseId = index;
    _this.collapseHref = "#" + index;

    _this.mouseOver = function (data) {

    };
};


var notesmodel = new (function () {
    var _this = this;

    _this.notes = ko.observableArray();

    _this.expand = function (data) {
        var userNotes = $("#usernotes");     
        userNotes.animate({ width: "300px", height: "400px" }, 400);
        $("#notesheader").hide();
        $("#usernotes #addnewnotebutton").show();
        $("#usernotes #collapsenotesbutton").show();
        
    };

    _this.collapse = function (data) {
        var userNotes = $("#usernotes");
        userNotes.animate({ width: "300px", height: "0px" }, 400);

        $("#usernotes #collapsenotesbutton").hide();
        $("#usernotes #addnewnotebutton").hide();
        $("#notesheader").show();
    };

    _this.startAddNewNote = function (data) {

        var userNotes = $("#usernotes");



        userNotes.append("<textarea id='notetextarea'></textarea>");
        $("#usernotes #notesaccordion").hide();
        $("#usernotes #addnewnotebutton").hide();       
        $("#usernotes #savenotebutton").show();
        $("#usernotes #cancelnotebutton").show();

    };

    var closeNoteEdit = function () {
        $("#usernotes #notetextarea").remove();      
        $("#usernotes #savenotebutton").hide();
        $("#usernotes #cancelnotebutton").hide();
        $("#usernotes #notesaccordion").show();
        $("#usernotes #addnewnotebutton").show();
    };

    _this.cancelNote = function (data) {
        closeNoteEdit();
    };

    _this.addNote = function (data) {

        var noteText = $("#usernotes #notetextarea")[0].value;
        var nextindex = _this.notes().length + 1;
        _this.addNoteToList(noteText, nextindex, new THREE.Vector3());

        closeNoteEdit();
    };

    _this.addNoteToList = function (noteText, noteIndex, vertex) {
        _this.notes.push(new note(noteText, noteIndex, new THREE.Vector3()));
    }

    _this.addPin = function (data) {
    };

    _this.count = ko.computed(function () {
        return _this.notes().length;
    });


    _this.forJSON = function () {
        var notesForJson = $.map(_this.notes(), function (note) {
            return { NoteText: note.text, NoteVertex: note.vertex };
        });

        return notesForJson;
    };


});