var userAccess = new (function(){
    
    var _this = this;
   

   _this.logedIn = ko.observable(false);
   

    _this.closeUserAuth = function() {
         $('#mask , .login-popup').fadeOut(300, function () {
         $('#mask').remove();
         });
    };


    _this.logOut = function() {
            $.ajax({                     
            url: '../Account/LogOut/',                     
            type: 'POST',
            success: function (data) {
                toastr.success('Loged out.','Success'); 
                _this.logedIn(false);
             
            },
            error: function() {
                toastr.error('Failed load user models', 'Error');
            }
        });
    }
    
  
    /*_this.loadUserData = function() {
     
        var div = $("#accordion");
        if(div.length === 0) {
           jQuery('<div/>', {
                id: 'accordion',               
            }).appendTo($("#body"));
           
           div = $("#accordion");          
           div.html("<ul id='sessionList' data-bind='foreach: sessions'>" + 			                    
			            "<li class='content' data-bind='foreach:sessionModels'>" + 
                            "<h1 data-bind='text:name'></h1>" + 
				            "<em class='bullet'></em><span data-bind='text:vertexCount'></span> " + 	
		                "</li>" +
                    "</ul>"
                   );
        }
        $.ajax({                     
            url: 'GetSavedModels/',    
            success: function (data) {
               
                var ModelsView = function(sessions) {
                    this.sessions = sessions;
                }     

                var SessionViewModel = function(name, index, models) {
                    this.sessionModels = models;
                    this.sessionname = name;
                    this.id = "tab-" + index;
                    this.href = "#tab-" + index;
                }

                var SavedModel = function(name, vertexCount, linkTo) {
                    this.name = name;
                    this.vertexCount = "Verices " + vertexCount;
                    this.link = linkTo;
                }

                
                var sessions = new Array();
                for(var i=0;i<data.length; i++)
                {
                    var sessionModels = new Array();
                    for(var j=0;j<data[i].length;j++) {        
                        var model = data[i][j];                
                        sessionModels.push(new SavedModel(model.ModelName, model.VertexCount, model.ID));
                    }

                    sessions.push(new SessionViewModel(i, i, sessionModels));
                }               

                var view = new ModelsView(sessions);
                ko.applyBindings(view, $("#accordion")[0]);

              
              
            },
            error: function() {
                toastr.error('Failed load user models', 'Error');
            }
        });
    };*/

  
    
    _this.showUserAuth = function () {
        var loginBox = $("#login-box");

        //Fade in the Popup and add close button
        loginBox.fadeIn(300);

        //Set the center alignment padding + border
        var popMargTop = ($(loginBox).height() + 24) / 2;
        var popMargLeft = ($(loginBox).width() + 24) / 2;

        $(loginBox).css({
            'margin-top': -popMargTop,
            'margin-left': -popMargLeft
        });

        // Add the mask to body
        $('body').append('<div id="mask"></div>');
        $('#mask').fadeIn(300);

        //subscribe to close click
        $('a.close, #mask').live('click',_this.closeUserAuth);

        $('button.submit_button').live('click', function(){
            
            var userName = $('form.signin .username')[1].value;
            var loginInfo = {
                UserName: userName,
                Password: $('form.signin .password')[1].value,
            };
            $.ajax({
            url: "../Account/LogOn",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(loginInfo),
            dataType: 'json',
            success: function (data) {
                if(!data){
                   toastr.error('Incorrect UserName or Password', 'Error!');
                }
                else {
                    toastr.success('Signed as ' + userName, "Done!");
                    _this.logedIn(true);
                    _this.closeUserAuth();               
                }
            },
            error: function(data) {
              toastr.error('Failed to login', 'Error!');
            }
           
        });

         return false;
      });
   
    }
});