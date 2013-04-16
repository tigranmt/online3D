requirejs.config({
    shim: {
            'lazy-1.8.4.min': { deps: ['jquery-1.9.min'] },
            'bootstrap.min': { deps: ['jquery-1.9.min'] },
            'userlogin': { deps: ['jquery-1.9.min', 'knockout-2.1.0.min'] },
            'startup': { deps: ['jquery-1.9.min', 'userlogin'] }
    }
});

require(["jquery-1.9.min", "lazy-1.8.4.min", "modernizr-1.7.min", "bootstrap.min", 
                "storage", "knockout-2.1.0.min", "toastr", "userlogin", "startup", 
                "Drives/skydrive", "Drives/dbdrive"], function (util) {
    //This function is called when scripts/helper/util.js is loaded.
    //If util.js calls define(), then this function is not fired until
    //util's dependencies have loaded, and the util argument will hold
    //the module value for "helper/util".


});