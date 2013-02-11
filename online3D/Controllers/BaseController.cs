using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace online3D.Controllers
{
    public class BaseController : Controller
    {
        protected BaseController()
        {
            bool debugMode = false;

            #if DEBUG
                debugMode = true;
            #endif

            ViewBag.DebugMode = debugMode;
        }
    }
}