using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace online3D.Models
{
    
    /// <summary>
    /// Caches information sent to the server
    /// </summary>
    public static class SendCache 
    {
        /// <summary>
        /// Vertices per key 
        /// </summary>
        internal static Dictionary<string, List<string>> vertexData = new Dictionary<string, List<string>>();

        /// <summary>
        /// Face colors per key
        /// </summary>
        internal static Dictionary<string, List<string>> faceColorData = new Dictionary<string, List<string>>();

        /// <summary>
        /// Image per key in base64 format
        /// </summary>
        internal static Dictionary<string, string> modelImages = new Dictionary<string, string>();

        /// <summary>
        /// List of notes per key
        /// </summary>
        internal static Dictionary<string, List<Note>> notes = new Dictionary<string, List<Note>>();


        /// <summary>
        /// Expired date per key. Needs to send expired handle on the model, to chekif there is some trash
        /// in memory due the some connection failure or problems
        /// </summary>
        internal static Dictionary<string, DateTime> expiresOn = new Dictionary<string, DateTime>();


        public static Dictionary<string, DateTime> internalDic {
            get
            {
                return expiresOn;
            }
        
        }

        public static DateTime GetExpiredDateOfModel(ModelInfo mi) {

            var key = KeyFromModel(mi);
            DateTime expires = default(DateTime);
            expiresOn.TryGetValue(key, out expires);

            return expires;
        }


        /// <summary>
        /// lock object
        /// </summary>
        private static object _lock = new object();


        /// <summary>
        /// Adds or aggergates to already available data an information present in the given model
        /// </summary>
        /// <param name="mi"></param>
        /// <returns></returns>
        public static int AddModel(ModelInfo mi)
        {
            lock (_lock)
            {
                List<string> temp = null;
                var key = KeyFromModel(mi);

                if (mi.ExpiresOn != default(DateTime))
                    expiresOn[key] = mi.ExpiresOn;

                if (!vertexData.TryGetValue(key, out temp))
                    vertexData[key] = new List<string>();

                if (mi.Vertices == null)
                    return 0;

                vertexData[key].AddRange(mi.Vertices);

                if (!faceColorData.TryGetValue(key, out temp))
                    faceColorData[key] = new List<string>();
           
                if (!string.IsNullOrEmpty(mi.ModelImage))
                    modelImages[key] = mi.ModelImage;

                if (mi.Notes != null)
                    notes[key] = mi.Notes;

            

                return vertexData[key].Count;
            }
        }

      
        public static List<string> GetVertices(ModelInfo mi)
        {
            lock (_lock)
            {
                var key = KeyFromModel(mi);
                if (!vertexData.ContainsKey(key))
                    return new List<string>();

                return vertexData[key];
            }
        }

        public static List<string> GetFaceColors(ModelInfo mi)
        {
            lock (_lock)
            {
                var key = KeyFromModel(mi);
                if (!faceColorData.ContainsKey(key))
                    return new List<string>();

                return faceColorData[key];
            }
        }

        public static string GetImageData(ModelInfo mi)
        {
            lock (_lock)
            {
                var key = KeyFromModel(mi);
                if (!modelImages.ContainsKey(key))
                    return string.Empty;

                return modelImages[key];
            }
        }

        public static List<Note> GetNotes(ModelInfo mi)
        {
            lock (_lock)
            {
                var key = KeyFromModel(mi);
                if (!notes.ContainsKey(key))
                    return new List<Note>();

                return notes[key];
            }
        }



        /// <summary>
        /// Removes all internal information associated to a given model
        /// </summary>
        /// <param name="mi"></param>
        public static void Remove(ModelInfo mi)
        {
            var key = KeyFromModel(mi);
            Remove(key);
        }


        /// <summary>
        /// Removes all internal information associated to a given key
        /// </summary>
        /// <param name="key"></param>
        public static void Remove(string key)
        {
           lock(_lock) 
           {
               vertexData.Remove(key);
               faceColorData.Remove(key);
               modelImages.Remove(key);
               notes.Remove(key);
               expiresOn.Remove(key);
           }
        }

        /// <summary>
        /// Removes vertices from the internal dic
        /// </summary>
        /// <param name="mi"></param>
        public static void RemoveVerticesData(ModelInfo mi)
        {
            lock (_lock)
            {
                var key = KeyFromModel(mi);
                vertexData.Remove(key);
            }
        }


        /// <summary>
        /// Removes face colors from the internal dic
        /// </summary>
        /// <param name="mi"></param>
        public static void RemoveFaceColorsData(ModelInfo mi)
        {
            lock (_lock)
            {
                var key = KeyFromModel(mi);
                faceColorData.Remove(key);
            }
        }

        /// <summary>
        /// Removes image data from the internal dic
        /// </summary>
        /// <param name="mi"></param>
        public static void RemoveImageData(ModelInfo mi)
        {
            lock (_lock)
            {
                var key = KeyFromModel(mi);
                modelImages.Remove(key);
            }
        }

        /// <summary>
        /// Removes notes from the internal dic
        /// </summary>
        /// <param name="mi"></param>
        public static void RemoveNotes(ModelInfo mi)
        {
            lock (_lock)
            {
                var key = KeyFromModel(mi);
                notes.Remove(key);
            }
        }

        private static string KeyFromModel(ModelInfo mi)
        {
            return mi.SessionName + "_" + mi.ID + "_" + mi.ModelName;
        }
    }
}