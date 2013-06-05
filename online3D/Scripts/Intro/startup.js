var startup = new (function () {

    "use strict";


    window.APP_NAME = "Online3D";

    var _this = this;

    //rooting map
    var rootMap = {
        "STL": "/Stl/StlView",
        "ONLINE3D": "/Stl/StlView",
        "OBJ": "/Stl/StlView",
    }



    //list of supported extensions
    var supportedExtensions = ["STL", window.APP_NAME.toUpperCase(), "OBJ"];

    //for now always ok
    function extensionIsOk(files) {
        var firstExtension = undefined;
        for (var i = 0; i < files.length; i++) {

            //get extension
            var extension = files[i].name.split('.').pop().toUpperCase();
            if (firstExtension === undefined)
                firstExtension = extension;
//            else {
//                //if files are of different extension, can not accept it
//                if (firstExtension !== extension)
//                    return false;
//            }

            //check if recovered extension is in the array of supprotable ones
            if ($.inArray(extension, supportedExtensions) < 0)
                return false;
        }
        return true;
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


    function loadFilesFromRemoteDriveAsync(files) {

        if (files.length === 0)
            return;

        var index = files.length;
        var error = false;



        (function loadSingleFile() {


            index--;

            //iteration trminated
            if (index < 0) {

                if (!error) {
                    var f0 = files[0];
                    //send to another page of the extension of the FIRST file in the sequence, if there are more then one
                    var extension = f0.name.split('.').pop();
                    var path = rootMap[extension.toUpperCase()];
                    if (path) {
                        window.location.replace(path);
                    }
                }
                return;
            }

            var f = files[index];
            var fileData = {
                "fileName": f.name,
                "fileSize": f.size,
                "fileData": f.data
            }
            if (addToStore(fileData, loadSingleFile) === false) {
                toastr.error('Failed to load file ' + f.name, 'Error');
                showProgress(false);
                window.indexedFiles.deletebase();
                index--;
                error = true;
                return;
            }


        })();
    }


    /// Loads session file, that was saved before 
    /// into JSON ASCII file
    function loadSesisonFile(sessionFile) {

        //create a FileReader object
        var reader = new FileReader();

        var jumpToView = function () {
            var extension = sessionFile.name.split('.').pop();
            var path = rootMap[extension.toUpperCase()];
            if (path) {
                window.location.replace(path);
            }
        }

        reader.onload = function (event) {
            var data = event.target.result;
            if (reader.readyState == 2) {

                var fileData = {

                    "fileName": sessionFile.name,
                    "fileSize": 1,
                    "fileData": data
                };


                if (addToStore(fileData, jumpToView) === false) {
                    toastr.error('Failed to load file ' + sessionFile.name, 'Error');
                    showProgress(false);
                }

            }
            else {
                toastr.error('Failed to read the data', 'Error');
                showProgress(false);
            }


        };

        reader.onerror = function (event) {
            console.error("File could not be read! Error code: " + event.target.error.code);
            toastr.error('Failed to load file ' + file.name + ' Error: ' + event.target.error.toString(), 'Error');
            showProgress(false);
        };

        //this is a FILE object
        reader.readAsBinaryString(sessionFile);
    }

    /*
    Load files in sequence
    */
    function loadFiles(files) {

        //check if WebGL is supported here (may be not the best place to checck this...)
        if (!compatibilityChecks())
            return;

        if (files.length === 0)
            return;

        //check if this is a saved session file
        if (files.length === 1) {

            //get the extension of the file 
            var extension = files[0].name.split('.').pop().toUpperCase();
            if (extension === window.APP_NAME.toUpperCase()) {

                //yes, this is a session file, so we need to manage it in another way
                loadSesisonFile(files[0]);

                return;
            }
        }

        //read file like a data 
        if (files) {

            showProgress(true);

            var index = files.length;

            var runLoad = function () {
                index--;
                //loop finished
                if (index < 0) {
                    //window.indexedFiles.deletebase();
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



                //this is a BLOB obect  
                if (file.blob !== undefined) {
                    reader.readAsBinaryString(file.data);
                }
                else {
                    //this is a FILE object
                    reader.readAsBinaryString(file);
                }

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

        if (extensionIsOk(files)) {
            loadFiles(files);
        }
        else {
            toastr.error('Not supported file format', 'Error');
        }
    }

    function loadFileFromDisk(event) {
        var files = event.target.files;
        // var file = files[0];

        if (extensionIsOk(files)) {
            loadFiles(files);
        }
        else {
            toastr.error('Not supported file format', 'Error');
        }
    }

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

    this.openFileDialog = function () {
        $("#fileLoader").click();
    }

    this.openDropboxDrive = function () {

        var filesLoadingStarted = function () {
            showProgress(true);
        }

        var fileLoadingFinished = function (files) {
            showProgress(false);
            //loadFilesFromRemoteDriveAsync(files);
            loadFiles(files);
        }


        dbdrive.chooseFiles(filesLoadingStarted, fileLoadingFinished);
    }

    this.openSkyDrive = function () {
        var fileSelected = function () {
        }

        var fileDownloaded = function () {
        }

        skydrive.showUI(fileSelected, fileDownloaded);
    }

    this.openGoogleDrive = function () {

        var fileSelected = function () {
        }

        var fileDownloaded = function () {
        }

        gdrive.showUI(fileSelected, fileDownloaded);
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


  

    this.loadSampleModelPreview = function (completeCallback) {
        var complete = completeCallback;
        $.ajax({
            url: '../Stl/GetSavedModelPreview/first',
            success: function (data) {
                if (complete !== undefined)
                    complete(true);
                if (data !== false) {
                    $("#sample_preview").css('visibility', 'visible');
                    data.ModelName = "View sample ( " + data.ModelName + " )";
                    ko.applyBindings(data, $("#sample_preview")[0]);
                }
            },
            error: function (data) {
                if (complete !== undefined)
                    complete(false);
            }
        });
    }

    var setupPopovers = function () {
        $("#presentation-view").popover();
        $("#presentation-share").popover();
        $("#presentation-collaborate").popover();
        $("#presentation-cloud").popover();

      
        
        
    }

    //run 
    if (compatibilityChecks()) {
        setupDragDropEvents();
        setupFileLoadEvents();
        setupPopovers();
        // _this.loadSampleModelPreview();
        $("#presentation").slideToggle(function () {
            setupPopovers();          
        });
        userAccess.UpdateUI();
        $('#access').on('click', function () {
            userAccess.requestUserAuth();
        });

       // $("#introImageSrc").lazyload();
        $("#iconImageSrc").lazyload();

    }

    window.indexedFiles.openbase();
})




