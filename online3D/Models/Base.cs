using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Script.Serialization;
using System.Text;
using System.Net;
using System.IO;
using MongoDB.Driver;

namespace online3D.Models
{
    public class Base : IBase
    {
        private class GoogleShortenedURLResponse
        {
            public string id { get; set; }
            public string kind { get; set; }
            public string longUrl { get; set; }
        }


        private class GoogleShortenedURLRequest
        {
            public string longUrl { get; set; }
        }
 

        /// <summary>
        /// Saves Modelnfo in the base
        /// </summary>
        /// <param name="mi"></param>
        /// <returns></returns>
        public bool Save(ModelInfo mi)
        {

            if (mi == null)
                return false;

            mi.UniqueID = GetUniqueID(mi);
            mi.SaveDate = DateTime.Now;
            return SaveToMongo(mi);

            
        }

        private bool SaveToMongo(ModelInfo mi)
        {
            MongoServerSettings settings = new MongoServerSettings();
            settings.Server = new MongoServerAddress("localhost", 27017);
            // Create server object to communicate with our server
            MongoServer server = new MongoServer(settings);
            // Get our database instance to reach collections and data
            var database = server.GetDatabase("MessageDB");
           // database.


            return true;
        }


        public object GetUniqueID(ModelInfo mi)
        {
            string randomUrl = GetBaseUrl() + "//" + mi.Format + "//" + Path.GetFileNameWithoutExtension(Path.GetTempFileName());
            return GetShortedUrl(randomUrl);
        }


        /// <summary>
        /// Make use of google shortner URL services.
        /// </summary>
        /// <param name="longUrl"></param>
        /// <returns></returns>
        private string GetShortedUrl(string longUrl)
        {
            string googReturnedJson = string.Empty;
            JavaScriptSerializer javascriptSerializer = new JavaScriptSerializer();
 
            GoogleShortenedURLRequest googSentJson = new GoogleShortenedURLRequest();
            googSentJson.longUrl = longUrl;
            string jsonData = javascriptSerializer.Serialize(googSentJson);
             
            byte[] bytebuffer = Encoding.UTF8.GetBytes(jsonData);
 
            WebRequest webreq = WebRequest.Create("https://www.googleapis.com/urlshortener/v1/url");
            webreq.Method = WebRequestMethods.Http.Post;
            webreq.ContentLength = bytebuffer.Length;
            webreq.ContentType = "application/json";            
 
            using (Stream stream = webreq.GetRequestStream())
            {
                stream.Write(bytebuffer, 0, bytebuffer.Length);
                stream.Close();
            }
 
            using (HttpWebResponse webresp = (HttpWebResponse)webreq.GetResponse())
            {
                using (Stream dataStream = webresp.GetResponseStream())
                {
                    using (StreamReader reader = new StreamReader(dataStream))
                    {
                        googReturnedJson = reader.ReadToEnd();
                    }
                }
            }

            GoogleShortenedURLResponse googUrl = javascriptSerializer.Deserialize<GoogleShortenedURLResponse>(googReturnedJson);
            return googUrl.id;
        }


        private string GetBaseUrl()
        {
            var request = HttpContext.Current.Request;
            var appUrl = HttpRuntime.AppDomainAppVirtualPath;
            var baseUrl = string.Format("{0}://{1}{2}", request.Url.Scheme, request.Url.Authority, appUrl);

            return baseUrl;
        }
    }

}