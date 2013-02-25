using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace online3D.Models
{
    public static class VerticesHolder
    {
        private static Dictionary<string, List<string>> vertexData = new Dictionary<string, List<string>>();
        private static Dictionary<string, List<string>> faceColorData = new Dictionary<string, List<string>>();
        private static Dictionary<string, string> modelImages = new Dictionary<string, string>();
        private static object _lock = new object();
        public static int AddModel(ModelInfo mi)
        {
            lock (_lock)
            {
                List<string> temp = null;
                var key = KeyFromModel(mi);
                if (!vertexData.TryGetValue(key, out temp))
                    vertexData[key] = new List<string>();

                if (!faceColorData.TryGetValue(key, out temp))
                    faceColorData[key] = new List<string>();

                vertexData[key].AddRange(mi.Vertices);
                
                if(mi.FaceColors!=null)
                    faceColorData[key].AddRange(mi.FaceColors);

                if (!string.IsNullOrEmpty(mi.ModelImage))
                    modelImages[key] = mi.ModelImage;

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

        public static void RemoveVerticesData(ModelInfo mi)
        {
            lock (_lock)
            {
                var key = KeyFromModel(mi);
                vertexData.Remove(key);
            }
        }

        public static void RemoveFaceColorsData(ModelInfo mi)
        {
            lock (_lock)
            {
                var key = KeyFromModel(mi);
                faceColorData.Remove(key);
            }
        }

        public static void RemoveImageData(ModelInfo mi)
        {
            lock (_lock)
            {
                var key = KeyFromModel(mi);
                modelImages.Remove(key);
            }
        }

        private static string KeyFromModel(ModelInfo mi)
        {
            return mi.ID + "_" + mi.ModelName;
        }
    }
}