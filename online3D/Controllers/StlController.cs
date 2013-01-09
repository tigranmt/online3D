using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using ModelViewer3D.Helpers;
using online3D.Models;
using MongoDB.Bson.Serialization;
using online3D.Helpers;

namespace ModelViewer3D.Controllers
{
    [Layout("StlLayout")]
    public class StlController : Controller
    {
      
        //
        // GET: /Stl/
       
        public ActionResult StlView()
        {
            return View("StlView");
        }


        
        [HttpPost]
        [AuthenticationRequiered(Users="sweden")]
        public ActionResult SaveModel(ModelInfo model)
        {

            IData access = new MongoDataAccess();
            model.User = User.Identity.Name;

            //generate unique link for the model 
            if (string.IsNullOrEmpty(model.ID))
            {
                model.ID = LinkGenerator.GenerateTempLink(model, HttpContext.Request);
            }

            var savedCount = VerticesHolder.AddModel(model);
            if (savedCount == model.VertexCount)
            {
                model.Vertices = VerticesHolder.GetVertices(model);
                bool saveResult = access.SaveModel(model);
                VerticesHolder.Remove(model);

                if (!saveResult)
                    return Json(false);
            }

            return Json(model.ID);
        }



        [HttpGet]
        [Authorize]
        public JsonResult GetSavedModels()
        {
            var username = User.Identity.Name;
            if (string.IsNullOrEmpty(username))
                return Json(false);
            MongoDataAccess access = new MongoDataAccess();

            var models = access.ReadUserModelCollection(username);
            return Json(models, JsonRequestBehavior.AllowGet);
        }


        [HttpGet]       
        public JsonResult  GetModels(string id, int modelIndex, int packetIndex)
        {
            MongoDataAccess access = new MongoDataAccess();           

            var models = access.ReadModelCollection(id);

            if (modelIndex >= models.Count())
                return Json("alldone", JsonRequestBehavior.AllowGet); //signal, there is nothing more to load. All done

            var model = models.ElementAt(modelIndex);
            var tempList = new List<Vertex>();

            var verticesCount = model.Vertices.Count();
            var tempModel = model.LightClone();
            var step = (int)( verticesCount/ 9);

            var start = packetIndex * step;
            var end = (packetIndex * step) + step;

            if(start >=verticesCount)
                return Json("modeldone", JsonRequestBehavior.AllowGet); //signal, we finish with model

            for (int i = start; i < end; i++)
            {
                if (i >= verticesCount)
                    break;

                tempList.Add(model.Vertices.ElementAt(i));
            }

            tempModel.Vertices = tempList;

            return Json(tempModel, JsonRequestBehavior.AllowGet);
        }

       
        public ActionResult  LoadModel(string id)
        {
            //generate default STL view, but add also ViewBag information
            var view = StlView() as ViewResult;
            view.ViewBag.ID = id;
            return view;
          
        }
        

    }


}


