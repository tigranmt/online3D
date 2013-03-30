var startup = new (function () {

    window.indexedFiles.openbase();

    var _this = this;

    //rooting map
    var rootMap = {
        "STL": "/Stl/StlView"
    }



    //list of supported extensions
    var supportedExtensions = ["STL"];

    //for now always ok
    function extensionIsOk(files) {
        var firstExtension = undefined;
        for (var i = 0; i < files.length; i++) {

            //get extension
            var extension = files[i].name.split('.').pop().toUpperCase();
            if (firstExtension === undefined)
                firstExtension = extension;
            else {
                //if files are of different extension, can not accept it
                if (firstExtension !== extension)
                    return false;
            }

            //check if recovered extension is in the array of supprotable ones
            if ($.inArray(extension, supportedExtensions) < 0)
                return false;
        }
        return true;
    }


    this.openFileDialog = function () {
        $("#fileLoader").click();
    }

    this.openDropboxDrive = function () {
    }

    this.openGoogleDrive = function () {

        // Use the Google Loader script to load the google.picker script.
        //google.setOnLoadCallback(createPicker);
        google.load('picker', '1', { "callback": createPicker });

        // Create and render a Picker object for searching images.
        function createPicker() {

            var view = new google.picker.View(google.picker.ViewId.DOCS);
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
                    callback(xhr.responseText);
                };
                xhr.onerror = function () {
                    callback(null);
                };
                xhr.send();
            } else {
                callback(null);
            }
        }

        function getFilesFromServer(files) {
            for (var i = 0; i < files.length; i++) {
                var f = files[i];
                downloadFile(f, getFileCallback);
            }
        }


        function getFileCallback(data) {

        }

    }


    /*adds specified file to store*/
    function addToStore(fileData, nextcall) {
        return window.indexedFiles.addFile(fileData, nextcall);
    }


    function showProgress(show) {
        var visibilityProgress = (show) ? 'visible' : 'hidden';
        var visibilityRest = (show) ? 'hidden' : 'visible';

        $("#db_progress").css({ visibility: visibilityProgress });
        $("#intro_text").css({ visibility: visibilityRest });
        $("#selectfile_button").css({ visibility: visibilityRest });
    }

    /*
    Load files in sequence
    */
    function loadFiles(files) {

        //check if WebGL is supported here (may be not the best place to checck this...)
        if (!compatibilityChecks())
            return;

        if (files.length == 0)
            return;

        //read file like a data 
        if (files) {

            showProgress(true);

            var index = files.length;

            var runLoad = function () {
                index--;
                //loop finished
                if (index < 0) {
                    window.indexedFiles.deletebase();
                    (function (file) {
                        //send to another page of the extension of the FIRST file in the sequence, if there are more then one
                        var extension = file.name.split('.').pop();
                        var path = rootMap[extension.toUpperCase()];
                        if (path) {
                            window.location.replace(path);
                        }
                    })(files[0]);

                } //loop finished management

                var file = files[index]; //get file
                var reader = new FileReader();
                reader.onload = function (event) {
                    var data = event.target.result;
                    if (reader.readyState == 2) {
                        // save to store 
                        var fileData = {
                            "fileName": file.name,
                            "fileSize": file.size,
                            "fileData": data
                        }

                        if (addToStore(fileData, runLoad) === false) {
                            toastr.error('Failed to load file ' + file.name, 'Error');
                            showProgress(false);
                        }

                    }
                    else {
                        toastr.error('Can not initialize GL engine', 'Error');
                        showProgress(false);
                    }


                };

                reader.onerror = function (event) {
                    console.error("File could not be read! Error code: " + event.target.error.code);
                    toastr.error('Failed to load file ' + file.name + ' Error: ' + event.target.error.toString(), 'Error');
                    showProgress(false);
                };

                //load all files in sequence                  
                reader.readAsBinaryString(file);

            };
            runLoad();

        }
        else {
            toastr.error('Can not load file: ' + file.name, 'Error');
        }


    }


    //load file from drop event
    function loadFileFromDrop(event) {
        var files = event.dataTransfer.files;
        // var file = files[0];

        if (extensionIsOk(files))
            loadFiles(files);
    }

    function loadFileFromDisk(event) {
        var files = event.target.files;
        // var file = files[0];

        if (extensionIsOk(files))
            loadFiles(files);
    }

    this.onDragEnter = function (event) {
        event.preventDefault();
    };

    this.onDragOver = function (event) {
        $(this).css('background-color', 'gray')
        event.stopPropagation();
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    };

    this.onDragLeave = function (event) {
        $(this).css('background-color', 'transparent')
        event.preventDefault();
    };

    this.onDrop = function (event) {
        event.preventDefault();
        event.stopPropagation();
        loadFileFromDrop(event);
    };

    function setupDragDropEvents() {
        if (!Modernizr.draganddrop) {
            toastr.error('Drag&Drop is not supproted on this browser', 'Error');
            return;
        }

        var fileDrop = $("#fileDropDiv")[0];
        if (fileDrop !== undefined) {
            fileDrop.addEventListener("dragenter", _this.onDragEnter, false);
            fileDrop.addEventListener("dragover", _this.onDragOver, false);
            fileDrop.addEventListener("dragleave", _this.onDragLeave, false);
            fileDrop.addEventListener("drop", _this.onDrop, false);
        }
    };

    function setupFileLoadEvents() {
        var loader = $("#fileLoader");
        if (loader !== undefined)
            loader.bind("change", loadFileFromDisk);
    };

    function compatibilityChecks() {
        if (!Modernizr.webgl) {
            toastr.error('WebGL is not supproted in this browser', 'Error');
            return undefined;
        }
        else if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
            toastr.error('The File API is not  supported in this browser.', 'Error');
            return false;
        }
        else if (!Modernizr.localstorage) {
            toastr.error('Local storage is not supported in this browser.', 'Error');
            return false;
        }

        return true;
    }

    this.loadSampleModelPreview = function (completeCallback) {
        var complete = completeCallback;
        $.ajax({
            url: '../Stl/GetSavedModelPreview/first',
            success: function (data) {
                if (complete !== undefined)
                    complete(true);
                $("#sample_preview").css('visibility', 'visible');
                data.ModelName = "View sample ( " + data.ModelName + " )";
                ko.applyBindings(data, $("#sample_preview")[0]);
            },
            error: function (data) {
                if (complete !== undefined)
                    complete(false);
            }
        });
    }

    $(document).ready(function () {
        if (compatibilityChecks()) {
            setupDragDropEvents();
            setupFileLoadEvents();
            _this.loadSampleModelPreview();
            userAccess.UpdateUI();
            $('#access').on('click', function () {
                userAccess.requestUserAuth();
            });
        }
    });

})




