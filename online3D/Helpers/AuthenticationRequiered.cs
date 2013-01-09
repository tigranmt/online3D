using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace online3D.Helpers
{
    public class AuthenticationRequiered : AuthorizeAttribute
    {
        public override void OnAuthorization(AuthorizationContext filterContext)
        {
            //bool skipAuthorization = filterContext.ActionDescriptor.IsDefined(typeof(AllowAnonymous), true)
            //|| filterContext.ActionDescriptor.ControllerDescriptor.IsDefined(typeof(AllowAnonymous), true);
            //if (!skipAuthorization)
            //{
                base.OnAuthorization(filterContext);
           // }
        }
   
    }
}