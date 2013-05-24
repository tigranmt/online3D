
var sessionInformation = new (function () {

    var _this = this;


    /*  Gets session info object from  provided parameters
     *   @param {string} sessionName The name of the session 
     *   @param {string} user        User name
     *   @param {string} emails      Emails seprated ny space to be sent notofication to.
     *   @param {string} date        The date of the session (any convenient string format)        
    */
    _this.getSessionManifest = function (sessionName, user, emails, date) {
        return {
            SessionName: sessionName,
            User: user || "",
            Emails: emails || "",
            Date: date || "",
            Meshes: [],
            Notes: [],
        };
    }


    /*  Gets session info object from  provided parameters
     *  @param {Array} meshes Collection of THREE.Mesh object with appropriate properties assigned        
     */
    _this.getSessionInfoFromMeshes = function (meshes) {

        if (meshes.length > 0) {
            var first = meshes[0];

            return _this.getSessionManifest(first.SessionName, first.User, "", first.SavedOn);

        }
    }

    /*
    *  Gets session info from online3D session JSON file
    *  @param {object} online3DSession Online£D session object
    */
    _this.getSessionInforFromOnline3DSession = function (online3DSession) {
        var manifest = _this.getSessionManifest(online3DSession.SessionName, online3DSession.User, online3DSession.Emails, online3DSession.Date);
        manifest.Notes = online3DSession.Notes;
        return manifest;
    }



});