
var userAccess = new (function(){
    
    var _this = this;
   

   _this.logedIn = ko.observable(false);
   

   function getCookie(cookie)
   {
        var i,x,y,ARRcookies=document.cookie.split(";");
        for (i=0;i<ARRcookies.length;i++)
        {
          x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
          y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
          x=x.replace(/^\s+|\s+$/g,"");
          if (x==cookie)
          {
            return unescape(y);
          }
        }
    }

    function setCookie(name,value,exdays)
    {
        var exdate=new Date();
        exdate.setDate(exdate.getDate() + exdays);
        var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
        document.cookie=name + "=" + c_value;
    }

   

    _this.closeUserAuth = function() {
        var signForm =  $("#signForm");
        if(signForm.length > 0)
            signForm.remove();
    };


    _this.logOut = function() {
            $.ajax({                     
            url: '../Account/LogOut/',                     
            type: 'POST',
            success: function (data) {
                toastr.success('Loged out.','Success');                      
                _this.CheckSigned();
                _this.UpdateUI();

            },
            error: function() {
                toastr.error('Failed load user models', 'Error');
            }
        });
    }
    
  
    _this.loadUserSavedModels = function() {
     
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
    };

    _this.CheckSigned = function() {
         var signedUser = getCookie("signed");
         _this.logedIn( (signedUser != "" && signedUser != undefined));;

         return _this.logedIn();
    };

  
    _this.UpdateUI = function() {
         var signedUser = getCookie("signed");


         var viewModels = $("#viewModels");
          var header = $("#header");
         if(header.length >0) {
            if(viewModels.length == 0) {
                header.before("<div id='viewModels' style='float:right;padding:20px; margin-right: -14px;'>" + 
                                "<button id='viewsaved' class='btn btn-large'  type='button' style='color:#04c;' ></button>" + 
                                "</div>");
                viewModels = $("#viewModels");
            }
         }

         //SIGNED in
         if(signedUser != "" && signedUser != undefined) {
            $("#access").text("Sign out");   
            $("#viewsaved").text("View models of " + signedUser);   
            viewModels.on('click', _this.loadUserSavedModels);
         }
         else {
           //NOT signed
            if(viewModels.length > 0)
                viewModels.remove();

            $("#access").text("Sign in");     
         }
    }
    
    _this.requestUserAuth = function () {
       
     
        var signedUser = getCookie("signed");
        if(signedUser == "" || signedUser === undefined) //NOT signed
        {
            // Add the mask to body
            $('body').append("<div id='signForm' class='modal hide fade' tabindex='-1' aria-hidden='true'>" + 
                           "<div class='modal-header'>" + 
                                "<button type='button' class='close' data-dismiss='modal' aria-hidden='true'>×</button>" + 
                                "<h3 id='myModalLabel'>Sign to see your saved models</h3>" + 
                            "</div>" +
                            "<div class='modal-body'>" + 
                               "<div class='control-group'>" + 
                                    "<label class='control-label' for='inputUserName'>User name</label>"+
                                    "<div class='controls'>" +
                                        "<input type='text' id='inputUserName' placeholder='Email'>" + 
                                    "</div>" + 
                                "</div>" + 
                                "<div class='control-group'>" + 
                                    "<label class='control-label' for='inputPassword'>Password</label>" +
                                    "<div class='controls'>" + 
                                        "<input type='password' id='inputPassword' placeholder='Password'>" + 
                                    "</div>" + 
                                "</div>" + 
                            "</div>" + 
                            "<div class='modal-footer'>" +
                                "<button class='btn' data-dismiss='modal' aria-hidden='true'>Close</button>" + 
                                "<button id='signInButton' class='btn btn-primary'>Sign in</button>"+
                            "</div>" + 
                        "</div>");
       
            $("#signForm").modal();
            $('#signForm #signInButton').on('click', function(){
            
          
            var userName = $("#signForm #inputUserName")[0].value;
            var loginInfo = {
                UserName: userName,
                Password: $("#signForm #inputPassword")[0].value,
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
                        _this.closeUserAuth();       
                        setCookie("signed",userName,1);
                        _this.CheckSigned();
                        _this.UpdateUI();
                    }
                },
                error: function(data) {
                    toastr.error('Failed to login', 'Error!');
                    _this.UpdateUI();
                }
           
            });
         
        
            return false;
         });
      }
      else { //SIGNED already, so unsign
           setCookie("signed","",1);
          _this.logOut();             
      }
   
    }
});