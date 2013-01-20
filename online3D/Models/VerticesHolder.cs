using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace online3D.Models
{
    public static class VerticesHolder
    {
        private static Dictionary<string, List<Vertex>> internalData = new Dictionary<string, List<Vertex>>();
        private static Dictionary<string, string> modelImages = new Dictionary<string, string>();
        public static int AddModel(ModelInfo mi)
        {
            List<Vertex> temp = null;
            var key = KeyFromModel(mi);
            if (!internalData.TryGetValue(key, out temp))
                internalData[key] = new List<Vertex>();

            internalData[key].AddRange(mi.Vertices);

            if (!string.IsNullOrEmpty(mi.ModelImage))
                modelImages[key] = mi.ModelImage;

            return internalData[key].Count;
        }

        public static IEnumerable<Vertex> GetVertices(ModelInfo mi)
        {           
            var key = KeyFromModel(mi);
            if (!internalData.ContainsKey(key))
                return new List<Vertex>();

            return internalData[key];
        }

        public static string GetImageData(ModelInfo mi)
        {
            var key = KeyFromModel(mi);
            if (!modelImages.ContainsKey(key))
                return string.Empty;

            return modelImages[key];
        }

        public static void RemoveVerticesData(ModelInfo mi)
        {
            var key = KeyFromModel(mi);
            internalData.Remove(key);
        }

        public static void RemoveImageData(ModelInfo mi)
        {
            var key = KeyFromModel(mi);
            modelImages.Remove(key);
        }

        private static string KeyFromModel(ModelInfo mi)
        {
            return mi.ID + "_" + mi.ModelName;
        }
    }
}