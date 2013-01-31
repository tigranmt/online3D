
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
            url: '../Account/LogOut',                     
            type: 'POST',
            success: function (data) {
                toastr.success('Loged out.','Success');     
                setCookie("signed","",1);                 
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
                class: 'modal hide fade' 
            }).appendTo($("#body"));
           
           div = $("#accordion"); 
           

           div.html("<div id='carousel' class='carousel slide'>" + 
                        "<div id='innercarousel' class='carousel-inner' data-bind='foreach: sessions'> " +  
                            "<div class='item'><img data-bind='attr:{src:image}'></img>" + 
                                "<div class='carousel-caption'>" + 
                                    "<h4 data-bind='text:name'> </h4> " +                                
                                "</div>" + 
                            "</div>" + 
                         "</div>" + 
                         "<a class='carousel-control left' href='#carousel' data-slide='prev'>&lsaquo;</a>" + 
                         "<a class='carousel-control right' href='#carousel' data-slide='next'>&rsaquo;</a>" +
                    " </div>");
        }
        $.ajax({                     
            url: '../Stl/GetSavedModels/',
            success: function (data) {
               

               if(data === false) {
                    toastr.error('Failed load user models', 'Error');
                    div.remove();//remove div just created
               }
               else {

                    var ModelsView = function(sessions) {
                        this.sessions = sessions;
                    }     

                    var Session = function(name, id, image, index) {
                          this.name = name;
                          this.id = id;
                          this.image = image;                          
                    }

                
                    var sessions = new Array();
                    for(var i=0; i<data.length; i++)
                    {    
                        var model = data[i];
                        sessions.push(new Session(model.ModelName, model.ID, model.ModelImage,i));                                          
                    }               

                    $("#accordion").modal();
                    var view = new ModelsView(sessions);
                    ko.applyBindings(view, $("#accordion")[0]);

                    //set the first item like an active one 
                    $("#innercarousel .item").first().removeClass("item").addClass("active item");
              }
              
            },
            error: function() {
                toastr.error('Failed load user models', 'Error');
                div.remove();//remove div just created
                
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
          
          _this.logOut();             
      }
   
    }
});