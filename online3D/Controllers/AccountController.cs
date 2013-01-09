using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using online3D.Helpers;
using System.Web.Security;

namespace online3D.Controllers
{
    public class AccountController : Controller
    {
        //
        // GET: /Account/
        
        public ActionResult LogOn(UserModel user)
        {
            if (!IsValid(user))
                return View(new EmptyResult());
            else
            {
                AuthUser(user);
                return Json(true);
            }
        }

        [HttpPost]
        [Authorize]
        public ActionResult LogOut() 
        {
            FormsAuthentication.SignOut();
            Response.Clear();
            return Json(true);
        }

        private bool IsValid(UserModel user)
        {
            if (user.Password != "sweden" && user.UserName != "sweden")
                return false;

            return true;
        }

        private void AuthUser(UserModel user)
        {  
            FormsAuthentication.SetAuthCookie(user.UserName, false);         
        }



    }
}
