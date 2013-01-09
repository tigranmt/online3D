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
    
    _this.loadUserData = function() {
     
        $.ajax({                     
            url: 'GetSavedModels/',                     
            type: 'GET',
            success: function (data) {
                for(d in data)
                    alert(d.toString());
            },
            error: function() {
                toastr.error('Failed load user models', 'Error');
            }
        });
    };
    
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
                toastr.success('Signed as ' + userName, "Done!");
                _this.logedIn(true);
                _this.closeUserAuth();
                _this.loadUserData();
            }
           
        });

         return false;
      });
   
    }
});