using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using ModelViewer3D.Helpers;
using online3D.Models;
using MongoDB.Bson.Serialization;
using online3D.Helpers;
using System.Drawing;

namespace ModelViewer3D.Controllers
{
    [Layout("StlLayout")]
    public class StlController : Controller
    {

        /// <summary>
        /// Default view
        /// </summary>
        /// <returns></returns>
        public ActionResult StlView()
        {
            return View("StlView");
        }


        private string GetUserName()
        {
            string userName = User.Identity.Name;
            if (string.IsNullOrEmpty(userName))
                userName = "sample";

            return userName;
        }

        /// <summary>
        /// Loads STL view and sets to bag the complete HTTP path to the model, that
        /// sequentially will be loaded after vis ajax call.
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        public ActionResult LoadModel(string id)
        {
            try
            {
                var userName = GetUserName();
                MongoDataAccess access = new MongoDataAccess();
                var models = access.ReadModelCollection(id, false).Where(m => m.User == userName);
                
                //if on current user failed, try search among sample models
                if(models.Count() == 0)
                    models = access.ReadModelCollection(id, false).Where(m => m.User == "sample");

                ViewBag.ID = models.First().ID;
            }
            catch(Exception ex)
            {
                return Json(false, JsonRequestBehavior.AllowGet);
            }

            return StlView();
        }


     

        /// <summary>
        /// Saves model in the base
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [AuthenticationRequiered(Users = "sweden")]
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
                model.ModelImage = VerticesHolder.GetImageData(model);
                bool saveResult = access.SaveModel(model);
                VerticesHolder.RemoveVerticesData(model);
                VerticesHolder.RemoveImageData(model);

                if (!saveResult)
                    return Json(false);
            }

            return Json(model.ID);
        }


        [HttpGet]
        public JsonResult GetSavedModelPreview(string id)
        {
            try
            {
                var userName = GetUserName();
                MongoDataAccess access = new MongoDataAccess();
                var models = access.ReadModelCollection(id, false).Where(m => m.User == userName);
                return Json(models.First(), JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(false);
            }
           
        }

        /// <summary>
        /// Get user's saved models
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        [Authorize]
        public JsonResult GetSavedModels()
        {
            var username = User.Identity.Name;
            if (string.IsNullOrEmpty(username))
                return Json(false);
            MongoDataAccess access = new MongoDataAccess();

            try
            {
                var models = access.ReadUserModelCollection(username);
                return Json(models, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(false);
            }
        }


        /// <summary>
        /// Get specified model's packet
        /// </summary>
        /// <param name="id"></param>
        /// <param name="modelIndex"></param>
        /// <param name="packetIndex"></param>
        /// <returns></returns>
        [HttpGet]
        public JsonResult GetModels(string id, int modelIndex, int packetIndex)
        {
            MongoDataAccess access = new MongoDataAccess();

            var collectionID = id.Split('/').Last();
            var models = access.ReadModelCollection(collectionID);

            if (modelIndex >= models.Count())
                return Json("alldone", JsonRequestBehavior.AllowGet); //signal, there is nothing more to load. All done

            var model = models.ElementAt(modelIndex);
            var tempList = new List<Vertex>();

            var verticesCount = model.Vertices.Count();
            var tempModel = model.LightClone();
            var step = (int)(verticesCount / 9);

            var start = packetIndex * step;
            var end = (packetIndex * step) + step;

            if (start >= verticesCount)
                return Json("modeldone", JsonRequestBehavior.AllowGet); //signal, we finish with model

            //tempModel.Vertices = model.Vertices.Skip(start).Take(end);
            for (int i = start; i < end; i++)
            {
                if (i >= verticesCount)
                    break;

                tempList.Add(model.Vertices.ElementAt(i));
            }

            tempModel.Vertices = tempList;

            return Json(tempModel, JsonRequestBehavior.AllowGet);
        }



    }


}


