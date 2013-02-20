
(function () {

    var dbName = "files";
    var storeName = "fileData";
    var keyPropertyName = "fileName";

    window.indexedFiles = {}; //add to window object

    // Initialising the window.IndexedDB Object
    window.indexedFiles.db = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    window.indexedFiles.db.keyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
    window.indexedFiles.db.transaction = window.IDBTransaction || window.webkitIDBTransaction;

    window.indexedFiles.failure = function (e) {
        console.log(e.toString());
    }

    window.indexedFiles.deletebase = function() {

       try {

           var dbreq =  window.indexedFiles.db.deleteDatabase(dbName);
           dbreq.onsuccess = function (event) {
               var db = event.result;
               console.log("indexedDB: " + dbName + " deleted");
           }

           dbreq.onerror = function (event) {
               console.log("indexedDB.delete Error: " + event.message);
           }

       }
       catch (e) {
           console.log("Error: " + e.message);
       }

   }
    
    //create store in most update way FireFox
    var createStore = function() {
        var v = "1.0"; 
        var request = window.indexedFiles.db.open(dbName,v); 
        request.onupgradeneeded = function(e) {
           window.indexedFiles.db = e.target.result;
           var db = window.indexedFiles.db;      
           if (db.objectStoreNames.contains(storeName)) {
                db.deleteObjectStore(storeName);
           }

           var store = db.createObjectStore(storeName,{ keyPath: "fileName" });
           
        }
        
        request.onfailure = window.indexedFiles.failure;
    }

    //old style base openening (currently used in Chrome) 
    var createStoreOld = function() {
       var request = window.indexedFiles.db.open(dbName, "1.0");      

       request.onsuccess = function (e) {

                
                window.indexedFiles.db = e.target.result;
                var db = window.indexedFiles.db;          
                var v = "1.0"; 
                var setVrequest = db.setVersion(v);
                // onsuccess is the only place we can create Object Stores
                setVrequest.onerror = window.indexedFiles.failure;
                setVrequest.onsuccess = function (e) {
                    if (db.objectStoreNames.contains(storeName)) {
                        db.deleteObjectStore(storeName);
                    }

                    var store = db.createObjectStore(storeName,
                    { keyPath: "fileName" });

                };       

                request.onfailure = window.indexedFiles.failure;
         };

        
    }


    window.indexedFiles.openbase = function () {
        window.indexedFiles.deletebase();
        
        //no more this code as in updated version of Chrome it treats IndexedDB as Firefox does
      /*  if(window.webkitIndexedDB) { //old style database open, Chrome for example
            createStoreOld();         
        }*/
        //else{
            createStore();     //updated latest way to open Indexed base
      //  }
    }


    window.indexedFiles.addFile = function (fileData, callback) {
        try { 

            var db = window.indexedFiles.db;
            if (!db.objectStoreNames.contains(storeName)) {
              db.createObjectStore(storeName,{ keyPath: "fileName" });
            }
            
            var trans = db.transaction([storeName], "readwrite");    
            var _next = callback;

            trans.oncomplete = function(e) {
                if(_next !== undefined)
                    _next();
            };

            trans.onerror = function (e) {
                console.log("Error Adding: ", e);
            };

            var store = trans.objectStore(storeName);
            var request = store.put(fileData);
            return true;
        }
        catch(e) {
           console.log(e.toString());
           return false;
        }
    }

    window.indexedFiles.getAllFiles = function (context,nextCallback) {
       
        var request = window.indexedFiles.db.open(dbName);
       
        var filesInDb = [];
        request.onsuccess = function(e) {
            window.indexedFiles.db = e.target.result;
            var db = window.indexedFiles.db;          
            var trans = db.transaction([storeName], "readwrite");
            var store = trans.objectStore(storeName);
      
            // Get everything in the store;
            var cursorRequest = store.openCursor();      
           
            cursorRequest.onsuccess = function(e) {
              var result = e.target.result;
              if(!!result == false) {
                nextCallback.call(context,filesInDb);
                return;
              }
      
              filesInDb.push(result.value);
              result.continue();
            };        
          
        }
    }

     window.indexedFiles.clearStore = function(){
        window.indexedFiles.db.deleteObjectStore(storeName);
     }

})();