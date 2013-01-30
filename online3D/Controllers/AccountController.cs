using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using online3D.Helpers;
using System.Web.Security;
using AppHarbor.Web.Security;

namespace online3D.Controllers
{
    public class AccountController : Controller
    {
        //
        // GET: /Account/
        
        public ActionResult LogOn(UserModel user)
        {
            if (!IsValid(user))
            {
                this.Response.Clear();
                return Json(false);
            }
            else
            {
                AuthUser(user);
                return Json(true);
            }
        }

        [HttpPost]
        //[Authorize] //No need for authorization for LogOut
        public ActionResult LogOut() 
        {
            //FormsAuthentication.SignOut();
            IAuthenticator authenticator = new CookieAuthenticator();
            authenticator.SignOut();
            Response.Clear();
            return Json(true);
        }

        private bool IsValid(UserModel user)
        {
            if (user.Password != "sweden" || user.UserName != "sweden")
                return false;

            return true;
        }

        private void AuthUser(UserModel user)
        {  
            IAuthenticator authenticator = new CookieAuthenticator(); 
            authenticator.SetCookie(user.UserName, true);
        }



    }
}
