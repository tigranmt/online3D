requirejs.config({
    shim: {           
        'lazy': ['jquery'],
        'bootstrap': ['jquery'] ,
        'userlogin': ['jquery'] ,
        'start':  ['jquery', 'userlogin'] 
    },
    paths: {
        'jquery'    : 'jquery-1.9.min',
        'lazy'      : 'lazy-1.8.4.min',
        'modernizr' : 'modernizr-1.7.min',
        'bootstrap' : 'bootstrap.min',
        'storage'   : 'storage',       
        'toastr'    : 'toastr',
        'userlogin' : 'userlogin',
        'start'     : 'startup',
        'skydrive'  : 'Drives/skydrive',
        'dbdrive'   : 'Drives/dbdrive'
    }
});

require(["jquery", "lazy", "modernizr", "bootstrap",
                "storage", "toastr", "userlogin", "start",
                "skydrive", "dbdrive"], function (jquery, lazy, modern, bootstrap, storage, toastr, user, start, skydrive, dbdrive) {
  
    userAccess.init();
    startup.init();
});




/*<script src="@Url.Content("~/Scripts/jquery-1.9.min.js")" type="text/javascript"></script>
<script src="@Url.Content("~/Scripts/lazy-1.8.4.min.js")" type="text/javascript"></script>
<script src="@Url.Content("~/Scripts/modernizr-1.7.min.js")" type="text/javascript"></script>
<script src="@Url.Content("~/Scripts/bootstrap.min.js")" type="text/javascript"></script>
<script src="@Url.Content("~/Scripts/storage.js")" type="text/javascript"></script>
<script src="@Url.Content("~/Scripts/knockout-2.1.0.min.js")" type="text/javascript"></script>
<script src="@Url.Content("~/Scripts/toastr.js")" type="text/javascript"></script>
<script src="@Url.Content("~/Scripts/userlogin.js")" type="text/javascript"></script>   
<script src="@Url.Content("~/Scripts/startup.js")" type="text/javascript"></script>
<script src="@Url.Content("~/Scripts/Drives/skydrive.js")" type="text/javascript"></script>
<script src="@Url.Content("~/Scripts/Drives/dbdrive.js")" type="text/javascript"></script>
*/