using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ModelViewer3D.Helpers
{
    public class LayoutAttribute : ActionFilterAttribute
    {
        private readonly string _layout;
        public LayoutAttribute(string layout)
        {
            _layout = layout;
        }

        public override void OnActionExecuted(ActionExecutedContext filterContext)
        {
            var result = filterContext.Result as ViewResult;
            if (result != null)
            {
                result.MasterName = _layout;
            }
        }
    }
}