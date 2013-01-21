var stlscene = new (function()  {

    var _this = this;
    _this.graphics = new init();
});

(function () {

  userAccess.CheckSigned();

  if ($("#bag").length !== 0) //load a data from the server
        stlscene.graphics.LoadFromServer($("#bag").text())
    else {
        stlscene.graphics.LoadFileData(); //load data from local file
    }

    /**
    * the menu
    */
    var $menu = $('#ldd_menu');

    /**
    * for each list element,
    * we show the submenu when hovering and
    * expand the span element (title) to 510px
    */
    $menu.children('li').each(function () {
        var $this = $(this);
        var $span = $this.children('span');
        $span.data('width', $span.width());

        $this.bind('mouseenter', function () {
            $menu.find('.ldd_submenu').stop(true, true).hide();
            $span.stop().animate({ 'width': '100px' }, 300, function () {
                $this.find('.ldd_submenu').slideDown(300);
            });
        }).bind('mouseleave', function () {
            $this.find('.ldd_submenu').stop(true, true).hide();
            $span.stop().animate({ 'width': $span.data('width') + 'px' }, 300);
        });
    });

    /**** BINDINGS ***/
    var access_Menu = $("#access_ul")[0];
    ko.applyBindings(viewmodels, access_Menu); 
    
    var save_Menu = $("#save_ul")[0];
    ko.applyBindings(viewmodels, save_Menu); 

    var view_Menu = $("#view_ul")[0];
    ko.applyBindings(viewmodels, view_Menu); 

    var basicPanel = $("#basicPanel")[0];
    ko.applyBindings(viewmodels, basicPanel); 

    var tools = $("#toolsPanel")[0];
    ko.applyBindings(viewmodels, tools); 

    /***************************/



   
})();
