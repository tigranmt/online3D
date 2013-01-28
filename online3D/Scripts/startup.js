window.indexedFiles.openbase();

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


function openFileDialog() {
    $("#fileLoader").click();
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
function LoadFiles(files) {

    //check if WebGL is supported here (may be not the best place to checck this...)
    if (!CompatibilityChecks())
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
function LoadFileFromDrop(event) {
    var files = event.dataTransfer.files;
    // var file = files[0];

    if (extensionIsOk(files))
        LoadFiles(files);
}

function LoadFileFromDisk(event) {
    var files = event.target.files;
    // var file = files[0];

    if (extensionIsOk(files))
        LoadFiles(files);
}

var onDragEnter = function (event) {
    event.preventDefault();
};

var onDragOver = function (event) {
    $(this).css('background-color', 'gray')
    event.stopPropagation();
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
};

var onDragLeave = function (event) {
    $(this).css('background-color', 'transparent')
    event.preventDefault();
};

var onDrop = function (event) {
    event.preventDefault();
    event.stopPropagation();
    LoadFileFromDrop(event);
};

function SetupDragDropEvents() {


    if (!Modernizr.draganddrop) {
        toastr.error('Drag&Drop is not supproted on this browser', 'Error');
        return;
    }

    $("#fileDropDiv")[0].addEventListener("dragenter", onDragEnter, false);
    $("#fileDropDiv")[0].addEventListener("dragover", onDragOver, false);
    $("#fileDropDiv")[0].addEventListener("dragleave", onDragLeave, false);
    $("#fileDropDiv")[0].addEventListener("drop", onDrop, false);

};

function SetupFileLoadEvents() {
    $("#fileLoader").bind("change", LoadFileFromDisk);
};

function CompatibilityChecks() {
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

function LoadSampleModelPreview() {
    $.ajax({
        url: '../Stl/GetSavedModelPreview/first',
        success: function (data) {
            $("#sample_preview").css('visibility', 'visible');
            data.ModelName = "View sample ( " + data.ModelName + " )";
            ko.applyBindings(data, $("#sample_preview")[0]);
        },
        error: function () {

        }
    });
}

$(function Init() {
    if (CompatibilityChecks()) {
        SetupDragDropEvents();
        SetupFileLoadEvents();
        LoadSampleModelPreview();
        userAccess.UpdateUI();
        $('#access').on('click', function () {
            userAccess.requestUserAuth();
        });
    }
});




