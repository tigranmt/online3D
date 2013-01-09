﻿var MenuItem = function (id, text, callback) {
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


    _this.navigation = [
                                { id: "tvBtn", alt: "Top view", src: "/Content/Images/tvs.png", callback: function () { stlscene.graphics.topView(); } },
                                { id: "bvBtn", alt: "Bottom view", src: "/Content/Images/bvs.png", callback: function () { stlscene.graphics.bottomView(); } },
                                { id: "lvBtn", alt: "Left view", src: "/Content/Images/lvs.png", callback: function () { stlscene.graphics.leftView(); } },
                                { id: "rvBtn", alt: "Right view", src: "/Content/Images/rvs.png", callback: function () { stlscene.graphics.rightView(); } },
                                { id: "fvBtn", alt: "Front view", src: "/Content/Images/fvs.png", callback: function () { stlscene.graphics.frontView(); } },
                                { id: "bvBtn", alt: "Back view", src: "/Content/Images/backvs.png", callback: function () { stlscene.graphics.backView(); } }

                  ];

    _this.tools = [{ id: "solidBtn", alt: "Solid view", src: "/Content/Images/solids.png", callback: function () { stlscene.graphics.solidView(); } },
                               { id: "wireFrameBtn", alt: "Wireframe view", src: "/Content/Images/wireframes.png", callback: function () { stlscene.graphics.wireframeView(); } },
                               { id: "meshBtn", alt: "Mesh view", src: "/Content/Images/meshs.png", callback: function () { stlscene.graphics.meshView(); } },
                               { id: "edgesBtn", alt: "Show edges", src: "/Content/Images/meshs.png", callback: function () { stlscene.graphics.showEdges(); } }
                  ];



   

    var logInCallback = function () {
        userAccess.showUserAuth();
    };

    var viewSavedModelsCallback = function () {
        userAccess.loadUserData();
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

    _this.save_menu = [{ id: "saveButton", text: "Save", callback: function () { /*save clicked*/ } }];


    _this.view_menu = [{ id: "soldViewButton", text: "Solid", callback: function () { stlscene.graphics.solidView(); } },
                            { id: "wireframeViewButton", text: "Wireframe", callback: function () { stlscene.graphics.wireframeView(); } },
                            { id: "meshViewButton", text: "Mesh", callback: function () { stlscene.graphics.meshView(); } },
                            { id: "pointViewButton", text: "Point cloud", callback: function () { /*point cloud clicked*/ } }];
}
);