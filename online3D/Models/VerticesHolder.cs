using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace online3D.Models
{
    public static class VerticesHolder
    {
        private static Dictionary<string, List<string>> internalData = new Dictionary<string, List<string>>();
        private static Dictionary<string, string> modelImages = new Dictionary<string, string>();
        private static object _lock = new object();
        public static int AddModel(ModelInfo mi)
        {
            lock (_lock)
            {
                List<string> temp = null;
                var key = KeyFromModel(mi);
                if (!internalData.TryGetValue(key, out temp))
                    internalData[key] = new List<string>();

                internalData[key].AddRange(mi.Vertices);

                if (!string.IsNullOrEmpty(mi.ModelImage))
                    modelImages[key] = mi.ModelImage;

                return internalData[key].Count;
            }
        }

        public static IEnumerable<string> GetVertices(ModelInfo mi)
        {
            lock (_lock)
            {
                var key = KeyFromModel(mi);
                if (!internalData.ContainsKey(key))
                    return new List<string>();

                return internalData[key];
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
                internalData.Remove(key);
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