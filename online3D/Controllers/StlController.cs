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
using online3D.Controllers;
using RestSharp;
using System.Dynamic;


namespace ModelViewer3D.Controllers
{
    [Layout("StlLayout")]
    public class StlController : BaseController
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
                IData access = GetDataAccess();
                var models = access.ReadModelCollection(id, false);

                if (models.Count() > 0)
                {
                    var first = models.First();
                    ViewBag.DownloadLink = first.ID;

                    var identity = this.User.Identity;
                    ViewBag.Auth = (identity.IsAuthenticated && first.User == identity.Name);
                }
                else
                {
                    //no session found in given link
                    return Json("wrongpath", JsonRequestBehavior.AllowGet);
                }

            }
            catch(Exception ex)
            {
                return Json(false, JsonRequestBehavior.AllowGet);
            }

            return StlView();
        }


        /// <summary>
        /// Reads template HTML page and genetes concrete HTML mail body based on parameters
        /// </summary>
        /// <param name="sessionName"></param>
        /// <param name="sessionId"></param>
        /// <param name="previewImageBase64"></param>
        /// <returns></returns>
        public string GetHtmlForMail(string sessionName, string sessionId)
        {            
            string path = System.Web.HttpContext.Current.Request.MapPath("~\\mailtemplate.html");
            return string.Format(System.IO.File.ReadAllText(path), sessionId, sessionName, DateTime.Now.ToString("MM/dd/yyyy hh:ss"));
        }


        /// <summary>
        /// Saves model in the base\
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]
        [Authorize]
        public ActionResult SendEmails(SessionInfo sinfo)
        {

            try
            {

                RestClient client = new RestClient();
                client.BaseUrl = "https://api.mailgun.net/v2";
                client.Authenticator = new HttpBasicAuthenticator("api", "key-8ipahp9txh4ko20plaxexe3o-id19up5");
                RestRequest request = new RestRequest();
                request.AddParameter("domain", "onlne3d.mailgun.org", ParameterType.UrlSegment);
                request.Resource = "{domain}/messages";
                request.AddParameter("from", "online3d@sharing.com");

                string []emails = sinfo.sessionEmails.Split(' '); 

                foreach(string e in emails) {
                    request.AddParameter("to", e);
                }
               
                var link = GetSessionLink(sinfo.sessionName);
                var userName = GetUserName();
                //string base64SessionImage = GetDataAccess().GetSessionImage(userName, sinfo.sessionName);
                string htmlBody = GetHtmlForMail(sinfo.sessionName, link);
               
                request.AddParameter("subject", "Online3D session was shared with you !");
                request.AddParameter("html", htmlBody);
                //var imagePath = System.Web.HttpContext.Current.Request.MapPath("~\\Content\\3D-icon.png");
                //request.AddFile("inline", imagePath);
                request.Method = Method.POST;
                client.Execute(request);


              
                return Json(sinfo);
            }
            catch (Exception ex)
            {
                LogEntry.logger.FatalException("Error on mail send", ex);
                return Json(false);
            }
        }

        /// <summary>
        /// Saves model in the base
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        [HttpPost]     
        [Authorize]
        public ActionResult SaveModel(ModelInfo model)
        {           
           
            model.User = User.Identity.Name;

            //generate unique link for the model 
            if (string.IsNullOrEmpty(model.ID))
            {
                model.ID = LinkGenerator.GenerateTempLink(model, HttpContext.Request);
            }

            var savedCount = Cache.AddModel(model);
            if (savedCount == model.VertexCount)
            {
                IData access = GetDataAccess();

                model.Vertices = Cache.GetVertices(model);
                model.ModelImage = Cache.GetImageData(model);
                model.FaceColors = Cache.GetFaceColors(model);
                model.Notes = Cache.GetNotes(model);
             

                bool saveResult = access.SaveModel(model);

                Cache.RemoveVerticesData(model);
                Cache.RemoveFaceColorsData (model);
                Cache.RemoveImageData(model);
                Cache.RemoveNotes(model);
              

                if (!saveResult)
                    return Json(false);
            }

            return Json(model.ID);
        }



        [HttpPost]
        [Authorize]
        public ActionResult DeleteSession(ModelInfo model)
        {
            try
            {
                var collection = model.ID.Split('/').Last();

                IData access = GetDataAccess();
                access.DeleteModelCollection(collection);

                return Json(true);
            }
            catch (Exception ex)
            {
                string link = (model.ID != null) ? model.ID : string.Empty;
                LogEntry.logger.ErrorException("Exception on deleting " + link, ex);
                return Json(false);
            }
        }

        private string GetSessionLink(string sessionName)
        {
            IData access = GetDataAccess();
            var userName = GetUserName();


            return access.GetLinkToSession(userName,sessionName);
           
        }


        /// <summary>
        /// Gets a preview for psecified ID model
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [HttpGet]
        public JsonResult GetSavedModelPreview(string id)
        {
            try
            {               

                IData access = GetDataAccess();
                if (id == "first")//first model of first collection was requested
                {
                    var models = access.ReadModelCollection(0, false);
                    if (models != null)
                        return Json(models.First(), JsonRequestBehavior.AllowGet);
                    else
                        return Json(false);
                }
                else
                {
                    var userName = GetUserName();                   
                    var models = access.ReadModelCollection(id, false).Where(m => m.User == userName);                    
                    return Json(models.First(), JsonRequestBehavior.AllowGet);
                }

               
            }
            catch (Exception ex)
            {
                LogEntry.logger.ErrorException("Exception in GetSavedModelPreview", ex);
                return Json(false,JsonRequestBehavior.AllowGet);
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
            IData access = GetDataAccess();

            try
            {
                var models = access.ReadUserModelCollection(username);
                return Json(models, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(false,JsonRequestBehavior.AllowGet);
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
            try
            {
                
                var collectionID = id.Split('/').Last();
                string key = ModelHolder.GetKeyFrom(collectionID, modelIndex);

                ModelInfo model = ModelHolder.GetInfo(key);;
                if (model == null)
                {
                    IData access = GetDataAccess();
                    var models = access.ReadModelCollection(collectionID, true, modelIndex);

                    if (models.Count() == 0)
                        return Json("alldone", JsonRequestBehavior.AllowGet); //signal, there is nothing more to load. All done

                    model = models.FirstOrDefault();
                    model.ExpiresOn = DateTime.Now.AddDays(1);
                    ModelHolder.Add(key, model);
                }
               

                /** vertices load **/
                var verticesCount = model.VertexCount;
                var tempModel = model.LightClone();
                var step = (int)(verticesCount / 27);

                var start = packetIndex * step;
                var end = (packetIndex * step) + step;

                if (start >= verticesCount) {
                    ModelHolder.Remove(key);
                    return Json("modeldone", JsonRequestBehavior.AllowGet); //signal, we finish with model
                }
                tempModel.Vertices = model.Vertices.Skip(start).Take(end - start).ToList();
                /***************************/


               
                //return colors in one shot
                if(packetIndex == 0)
                    tempModel.FaceColors = model.FaceColors;

                //return notes only for first packet of the first model
                if (modelIndex == 0 && packetIndex == 0)
                    tempModel.Notes = model.Notes;

                return Json(tempModel, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                LogEntry.logger.ErrorException("Error on loading " + id + " model: " + modelIndex + " packetIndex: " + packetIndex,
                                            ex);
                return Json(false, JsonRequestBehavior.AllowGet);
            }
        }


        private IData GetDataAccess()
        {
            return new MongoDataAccess();
        }



    }


}


