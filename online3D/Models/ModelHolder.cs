using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace online3D.Models
{
    public sealed class ModelHolder
    {
        private static object _lock = new object();
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