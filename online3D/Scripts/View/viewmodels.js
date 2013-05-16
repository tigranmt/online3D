var MenuItem = function (id, text, callback) {
    var self = this;
    self.id = id;
    self.text = text;
    self.callback = callback;
    self.itemVisible = ko.computed(function () {

        if (userAccess.logedIn === undefined)
            userAccess.init();

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
        window.open(home[0] + "//" + home[2] );
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

    _this.save_menu = [{ id: "saveScreenShotButton", text: "Screenshot", callback: function () { stlscene.graphics.takeScreenshot(true); } },
                        { id: "saveAsButton", text: "Save as STL", callback: function () { stlscene.graphics.saveSceneAs(); } }];


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

    _this.closeButtonHtml = "<button id='removenotebutton' class='close'  style='font-size: 1.1em;position:absolute;' type='button'>x</button>";
    _this.text = note;
    _this.shortDescription = note.substring(0, 10) + "...";
    _this.vertex = coord;
    _this.noteIndex = ko.observable(index);
    _this.collapseId = ko.observable(notesmodel.id_prefix + index);
    _this.collapseHref = ko.observable("#" + notesmodel.id_prefix + index);
    _this.noteRemoveRequest = undefined;
    _this.mouseOver = function () { };

    var closenoteElement = $("#noteelementclose");
    if (closenoteElement.length !== 0) {
        //eval
        var script = closenoteElement.attr("data-value");
        _this.mouseOver = eval(script);
    }



};


var notesmodel = new (function () {
    var _this = this;

    _this.id_prefix = "usernotescollapse";

    _this.note_text_limit = 300;
    _this.notes = ko.observableArray();

    _this.htmlChanged = undefined;

    _this.charactersToType = ko.observable(_this.note_text_limit);


    _this.notesmanager = TOOLS.startAgent(TOOLS.NOTES_MANAGER);
    TOOLS.stopAgent(TOOLS.NOTES_MANAGER);

    $("#usernotes").on("shown", function (data) {

        _this.notesmanager.removeAllPoints();

        var idstring = data.target.id.split(_this.id_prefix)[1];
        var idInt = parseInt(idstring) - 1;
        if (idInt >= 0 && idInt < _this.notes().length) {
            var note = _this.notes()[idInt];
            var vertex = note.vertex;

            //empty vertex
            if (vertex.x === 0 && vertex.y === 0 && vertex.z === 0)
                return;

            _this.notesmanager.addPoint(vertex);

        }
    });


    $("#usernotes").on("hidden", function (data) {

        _this.notesmanager.removeAllPoints();

    });



    //reevaluates indeices in array and all reltaed components of binded UI
    var refreshIndecies = function () {
        for (var i = 0; i < _this.notes().length; i++) {
            var originalIndex = _this.notes()[i].noteIndex();
            var newIndex = i + 1;

            _this.notes()[i].noteIndex(newIndex);
            _this.notes()[i].collapseId(_this.id_prefix + newIndex);
            _this.notes()[i].collapseHref("#" + _this.id_prefix + newIndex);
        }
    };

    var noteRemove = function (noteIndex) {
        if (noteIndex >= 0 && noteIndex < _this.notes().length) {
            _this.notes.splice(noteIndex, 1);
            $("#usernotes #removenotebutton").remove();

            refreshIndecies();
            _this.notesmanager.removeAllPoints();
        }
    };

    var raiseHtmlChangedEvent = function () {
        if (_this.htmlChanged !== undefined)
            _this.htmlChanged();
    };

    _this.mouseLeave = function (data, event) {

        var removenotebutton = $("#usernotes #removenotebutton");
        if (removenotebutton.length !== 0)
            removenotebutton.remove();
    };

    _this.accordionHtml = "<div id='notesaccordion' class='accordion' data-bind='foreach: notes'>" +
                            "<div class='accordion-group'> " +
                                "<div class='accordion-heading' data-bind='event:{mouseover:mouseOver.bind($parent)}, mouseoverBubble: false'>" +
                                    "<span class='badge badge-inverse' data-bind='text:noteIndex'></span>" +
                                    "<a id='noteshortdescription' class='accordion-toggle collapsed' data-toggle='collapse' data-bind='text:shortDescription, attr: { href: collapseHref }' data-parent='#notesaccordion'></a>" +
                                "</div>" +
                                "<div data-bind='attr: { id: collapseId }' class='accordion-body collapse'>" +
                                    "<div class='accordion-inner'><textarea  data-bind='text:text' rows=4 readonly></textarea></div>" +
                                "</div>" +
                            "</div>" +
                          "</div>";

    _this.collapseButtonHtml = "<button id='collapsenotesbutton' class='close'  style='font-size: 2.5em;' data-bind='click:collapse.bind($data)' type='button'>-</button>";



    _this.expand = function (animate) {
        var userNotes = $("#usernotes");

        if (animate !== false)
            userNotes.animate({ width: "300px", height: "400px" }, 400);

        var noteEdit = "";
        var edit = $("#noteedit");
        if (edit.length > 0)
            noteEdit = edit.attr("data-value");

        userNotes.html("<div style='position:fixed;width:300px;'>" +
                             noteEdit +
                            _this.collapseButtonHtml +
                        "</div>" + _this.accordionHtml

        );

        raiseHtmlChangedEvent();

    };

    _this.collapse = function (data) {
        var userNotes = $("#usernotes");
        userNotes.animate({ width: "3em", height: "2em" }, 400);
        userNotes.html("<button id='expandnotes' class='btn btn-mini btn-success'  data-bind='click:expand.bind($data)' type='button'>Notes</button>");
        _this.notesmanager.stopAgent();
        raiseHtmlChangedEvent();
    };

    _this.startAddNewNote = function (data) {

        var userNotes = $("#usernotes");
        userNotes.html("<div style='position:fixed;width:300px;'>" +
                            "<button id='savenotebutton' class='btn btn-mini btn-success' style='margin: 0.5em;' data-bind='click:addNote.bind($data)' type='button'>Save note</button>" +
                            "<button id='cancelnotebutton' class='btn btn-mini btn-danger' style='margin: 0.5em;' data-bind='click:cancelNote.bind($data)' type='button'>Cancel</button>" +
                            "<span data-bind='text:charactersToType' style='margin:0.0em 0.0em 0.0em 3.5em;'> </span> to go.." +
                            _this.collapseButtonHtml +
                            "<textarea id='notetextarea'></textarea>" +
                       "</div>"
        );

        $('#notetextarea').bind("keyup paste", function (e) {
            var curLength = $(this).val().length;

            if (curLength + 1 > _this.note_text_limit)
                $(this).val($(this).val().substring(0, _this.note_text_limit));

            _this.charactersToType(_this.note_text_limit - curLength);
        });

        _this.notesmanager.removeAllPoints();
        _this.notesmanager.startAgent();

        raiseHtmlChangedEvent();

    };

    var closeNoteEdit = function () {
        _this.expand(false);

        _this.notesmanager.removeAllPoints();
        _this.notesmanager.stopAgent();

    };

    _this.cancelNote = function (data) {
        closeNoteEdit();
    };

    _this.addNote = function (data) {

        var noteText = $("#usernotes #notetextarea")[0].value;
        var nextindex = _this.notes().length + 1;

        _this.addNoteToList(noteText, nextindex, _this.notesmanager.getPoint());

        closeNoteEdit();
    };

    _this.addNoteToList = function (noteText, noteIndex, vertex) {
        var singlenote = new note(noteText, noteIndex, vertex);
        singlenote.noteRemoveRequest = noteRemove;
        _this.notes.push(singlenote);
    }


    _this.count = ko.computed(function () {
        return _this.notes().length;
    });


    _this.forJSON = function () {
        var notesForJson = $.map(_this.notes(), function (note) {
            return { NoteText: note.text.substring(0, _this.note_text_limit), NoteVertex: note.vertex };
        });

        return notesForJson;
    };


});