using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using ModelViewer3D.Helpers;

namespace online3D.Controllers
{
    [Layout("TestsLayout")]
    public class TestsController : BaseController
    {
        //
        // GET: /Tests/

        public ActionResult Index()
        {
            return View("TestsView");
        }


        public ActionResult ConnectionTest()
        {
            return View("ConnectionTestsView");
        }

    }
}
