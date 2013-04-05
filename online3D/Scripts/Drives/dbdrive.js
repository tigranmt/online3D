﻿var dbdrive = dbdrive || {}; 

(function () {

        var appKey = { key: '254hrzt7wfhcmxv', secret: 'i9f2dtdx5y67wui', sandbox: true };
        var client = new Dropbox.Client(appKey);

        dbdrive.chooseFiles = function() {
            var options = {
                linkType: "direct",

                success: function (files) {
                    if(!client.isAuthenticated())
                        authenticateClient(files);
                    else {
                        console.log("Loading files..");
                        downloadFiles(files);
                    }              
                },

                cancel: function () {
                    console.log("File choose canceled");
                }
            }

            Dropbox.choose(options);
        }
   
        var downloadFiles = function(files) {
            // var read_options = {arrayBuffer: true};
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                client.readFile(file.name, function (error, data) {
                    if (error) {
                        return console.log(error);  // Something went wrong.
                    }

                    alert(data);  // data has the file's contents
                });
            }
        }

        var authenticateClient = function(files) {
                //var redirectOption = {rememberUser : true};
                //client.authDriver(new Dropbox.Drivers.Redirect(redirectOption));
                var popupOptions = {receiverUrl: window.location};
                client.authDriver(new Dropbox.Drivers.Popup(popupOptions));

                client.authenticate(function (error, client) {
                    if (error) {
                        console.log(error);
                    }  
                    else {
                        downloadFiles(files);
                    }                
                });          
        };

      
})();