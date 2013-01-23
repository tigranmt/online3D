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
        [Authorize]
        public ActionResult LogOut() 
        {
            FormsAuthentication.SignOut();
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
            //FormsAuthentication.SetAuthCookie(user.UserName, true, "/Stl");         
            FormsAuthenticationTicket authTicket = new FormsAuthenticationTicket(
                        1,
                            user.UserName,
                            DateTime.Now,
                            DateTime.Now.AddDays(1),
                            true,
                            user.UserName
                        );

            string encTicket = FormsAuthentication.Encrypt(authTicket);
            this.Response.Cookies.Add(
                new HttpCookie(
                    FormsAuthentication.FormsCookieName,
                    encTicket) { Expires = authTicket.Expiration });
        }



    }
}
