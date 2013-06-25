var dbdrive = dbdrive || {}; 

(function () {


        var totalFilesSelected = 0; 

        var appKey = { key: '254hrzt7wfhcmxv', secret: 'i9f2dtdx5y67wui', sandbox: false};
        var client = new Dropbox.Client(appKey);
        var ready = {};
        var start = {};
        var filesChosen = new Array(); 

        var isUserAuthenticated = function() {
            var firtsKey = localStorage.key(0);
            var retrievedObject = localStorage.getItem(firtsKey);

            if(retrievedObject === undefined || retrievedObject === null) 
                return false; 

            return (retrievedObject.key === appKey.key && retrievedObject.secret == appKey.secret);
        }
      
        dbdrive.chooseFiles = function(startCallback, readyCallback) {

            ready = readyCallback;
            start = startCallback; 
            var options = {
                linkType: "direct",
                multiselect : true,
                success: function (files) {
                    if(!isUserAuthenticated()){
                        authenticateClient(files);
                    }
                    else {
                        console.log("Loading files..");
                        console.log(files);
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
            var read_options = {arrayBuffer: true};
            var length  =files.length;

            if(length === 0) 
                return;

            start(); 
            var curIndex = 0;

            (function downloadSingle(){               

                var file = files[curIndex];
                if(!file) {                
                    ready(filesChosen);
                    return;
                }

                var readOptions = {blob  : true};
                client.readFile("Public/" + file.name, readOptions, function (error, data) {
                    if (error) {
                        //all files are loaded so call READY
                        if(filesChosen.length === length) 
                            ready(filesChosen);

                        return console.log(error);  // Something went wrong.
                    }                     
                    
                    var fileData = {
                        name : file.name, 
                        size : data.size,
                        data : data,
                        blob: true
                    };
                    filesChosen.push(fileData); 

                    
                    if(curIndex <= length - 1) {
                        curIndex++; 
                        downloadSingle();
                    }
                    
                });
                
            })();

        }

        var authenticateClient = function(files) {

             
                var redirectOption = {rememberUser : true, useQuery : true};
                client.authDriver(new Dropbox.Drivers.Redirect(redirectOption));
               // var popupOptions = {receiverUrl: window.location.origin};
               // client.authDriver(new Dropbox.Drivers.Popup(popupOptions));              

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