using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace online3D.Models
{

    /// <summary>
    /// Caches information requested from the server
    /// </summary>
    public sealed class GetCache
    {
        /// <summary>
        /// lock object
        /// </summary>
        private static object _lock = new object();

        /// <summary>
        /// ModelInfo per key 
        /// </summary>
        internal static Dictionary<string, ModelInfo> internalDic = new Dictionary<string, ModelInfo>();


        public static string GetKeyFrom(string collectionID, int modelIndex)
        {
            return collectionID + ":" + modelIndex;
        }

        public static ModelInfo GetInfo(string key)
        {
            lock (_lock)
            {
                ModelInfo mi = null;
                internalDic.TryGetValue(key, out mi);
                return mi;
            }
        }

        public static void Add(string key, ModelInfo mi)
        {
            lock (_lock)
            {
                internalDic[key] = mi;
            }
        }

        public static void Remove(string key)
        {
            lock (_lock)
            {
                internalDic.Remove(key);
            }
        }

     
    }
}