var gdrive = (new function () {

    "use strict";

    var _this = this;
    var selected, downloaded;
    var scopes = 'https://www.googleapis.com/auth/driv; http://online3d.apphb.com; http://http://localhost:56994/'

    function createPicker() {


        var view = new google.picker.View(google.picker.ViewId.DOCS);

        //no ned for filter
        //view.setMimeTypes("image/png,image/jpeg,image/jpg");

        var picker = new google.picker.PickerBuilder()
          .enableFeature(google.picker.Feature.NAV_HIDDEN)
          .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
        //.setAppId('938624936690.apps.googleusercontent.com')
        .setAppId('938624936690')
        

        //.setOAuthToken(AUTH_TOKEN) //Optional: The auth token used in the current Drive API session.
          .addView(view)
         // .addView(new google.picker.DocsUploadView())
          .setCallback(pickerCallback)
          .build();
        picker.setVisible(true);
    }

    // A simple callback implementation.
    function pickerCallback(data) {
        if (data.action == google.picker.Action.PICKED) {
            getFilesFromServer(data.docs);
        }
    }



    function downloadFile(file, callback) {
        if (file.url) {
            //var accessToken = gapi.auth.getToken().access_token;
            gapi.client.setApiKey('AIzaSyBznqXImd7XlnTp8bdOWprHTjOQNDCPX5o');
            gapi.client.load('drive', 'v2', function () {

                var scopes = 'https://www.googleapis.com/auth/drive';
                gapi.auth.authorize({ client_id: "938624936690.apps.googleusercontent.com", scope: scopes, immediate: true },              
                function () {

                    var myToken = gapi.auth.getToken();
                    gapi.client.request({
                        'path': '/drive/v2/files/' + file.id,
                        'method': 'GET',
                        callback: function (theResponseJS, theResponseTXT) {

                            var myXHR = new XMLHttpRequest();
                            myXHR.open('GET', theResponseJS.downloadUrl, true);                           
                           // myXHR.setRequestHeader('Authorization', 'Bearer ' + myToken.access_token);
                            myXHR.onreadystatechange = function (theProgressEvent) {
                                if (myXHR.readyState == 4) {
                                    //          1=connection ok, 2=Request received, 3=running, 4=terminated
                                    if (myXHR.status == 200) {
                                        //              200=OK
                                        console.log(myXHR.response);
                                    }
                                }
                            }
                            myXHR.send();
                        }
                    });
                }
                
                );

            });

        }
    }

    function getFilesFromServer(files) {
        for (var i = 0; i < files.length; i++) {
            var f = files[i];
            downloadFile(f);
        }
    }




    _this.showUI = function (selectCallback, fileLoadedCallback) {

        google.load('picker', '1', { "callback": createPicker });



        selected = selectCallback;
        downloaded = fileLoadedCallback;

    }

})