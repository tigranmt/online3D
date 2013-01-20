using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using ModelViewer3D.Helpers;
using online3D.Helpers;
using online3D.Models;

namespace ModelViewer3D.Controllers
{
  //  [Layout("_Layout")] 

   
    public class IntroController : Controller
    {      
        public ActionResult Start()
        {
            return View("IntroView");
        }

    }
}
