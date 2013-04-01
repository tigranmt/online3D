var gdrive = (new function () {

    "use strict";

    var _this = this;
    var selected, downloaded;

    function createPicker() {

        var view = new google.picker.View(google.picker.ViewId.DOCS);

        //no ned for filter
        //view.setMimeTypes("image/png,image/jpeg,image/jpg");

        var picker = new google.picker.PickerBuilder()
          .enableFeature(google.picker.Feature.NAV_HIDDEN)
          .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
          .setAppId('938624936690.apps.googleusercontent.com')

        //.setOAuthToken(AUTH_TOKEN) //Optional: The auth token used in the current Drive API session.

          .addView(view)
          .addView(new google.picker.DocsUploadView())
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
            var xhr = new XMLHttpRequest();
            xhr.open('GET', file.url);
            //xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            xhr.onload = function () {
                downloaded(xhr.responseText);
            };
            xhr.onerror = function () {
                downloaded(null);
            };
            xhr.send();
        } else {
            downloaded(null);
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
        // Create and render a Picker object for searching images.
        createPicker();
    }

})