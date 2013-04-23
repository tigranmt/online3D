var stlscene = new (function()  {

    var _this = this;
    _this.graphics = new init();
});

(function () {

  userAccess.CheckSigned();
  var bag = $("#bag");
  if (bag.length !== 0){ //load a data from the server
        
        var text = bag.text();
        bag.remove();       
        stlscene.graphics.LoadFromServer(text);       
    }
  else {
    stlscene.graphics.LoadFileData(); //load data from local file
  }

   

    /**** BINDINGS ***/
    var access_Menu = $("#access_ul")[0];
    ko.applyBindings(viewmodels, access_Menu); 
    
    var save_Menu = $("#save_ul")[0];
    ko.applyBindings(viewmodels, save_Menu); 

    var view_Menu = $("#view_ul")[0];
    ko.applyBindings(viewmodels, view_Menu); 


    var tools_Menu = $("#tools_ul")[0];
    ko.applyBindings(viewmodels, tools_Menu); 

    var basicPanel = $("#basicPanel")[0];
    ko.applyBindings(viewmodels, basicPanel); 

    var home_Menu = $("#home")[0];
    ko.applyBindings(viewmodels, home_Menu);


    var sinfo = $("#sessioninfo")[0];
    ko.applyBindings(viewmodels, sinfo);

    var notes = $("#usernotes")[0];
    if(notes !== undefined) {

       //apply first binding 
       ko.applyBindings(notesmodel, notes);

       //subscribe to html changed event so REapply bindings
       notesmodel.htmlChanged = function() {
            ko.applyBindings(notesmodel, notes);
       }
    }

    /***************************/
    /****** TOOLTIPS*****/
    for(var i=0;i<viewmodels.buttons.length;i++){
        var button = viewmodels.buttons[i];
        $("#" + button.id).tooltip({
            placement: 'right',
            trigger: 'hover',
            title : button.alt
        });
    }
   /***************************/

   /****Subscribe to events *****/
   $(".collapsedFileInfo").click(function(e) {
        if($(this)[0].className.indexOf('show')>=0) {
            $("#fileInfo").css("visibility", "visible");
            $(".hide.collapsedFileInfo").css("display", "block");
            $(".show.collapsedFileInfo").css("display", "none");
        }
        else{
            $("#fileInfo").css("visibility", "hidden");
            $(".hide.collapsedFileInfo").css("display", "none");
            $(".show.collapsedFileInfo").css("display", "block");
        }
   });

  
   /***************************/
})();
