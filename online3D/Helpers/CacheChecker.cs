using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using online3D.Models;

namespace online3D.Helpers
{

    /// <summary>
    /// Runs a timer and on every iteration checks if in memory caches contains yet information that was expired 
    /// (connection filed during uoload or download of models...) and deletes it from the memory
    /// </summary>
    public static class CacheChecker
    {
        static System.Timers.Timer checkTimer = null;
        
        /// <summary>
        /// Starts timer
        /// </summary>
        /// <param name="interval"></param>
        public static void Start(int interval = 3600*1000) 
        {
            if (checkTimer != null)
            {
                checkTimer.Stop();
                checkTimer.Dispose();
            }
            
            checkTimer = new System.Timers.Timer();
            checkTimer.Interval = interval;
            checkTimer.Elapsed += new System.Timers.ElapsedEventHandler(checkTimer_Elapsed);
            checkTimer.Start();
        }


        /// <summary>
        /// Stops timer
        /// </summary>
        public static void Stop()
        {
            checkTimer.Stop();
            checkTimer.Dispose();
        }


        /// <summary>
        /// Timer elpased handler 
        /// </summary>
        /// <param name="sender"></param>
        /// <param name="e"></param>
        static void checkTimer_Elapsed(object sender, System.Timers.ElapsedEventArgs e)
        {
            /*check of in GetCache there is any expired model*/
            List<string> modelsToRemove = new List<string>();
            var now = DateTime.Now;

            foreach (var kvp in GetCache.internalDic)
            {

                if (kvp.Value.ExpiresOn < now)
                    modelsToRemove.Add(kvp.Key);
            }
            /******************/ 

            /*check of in Cache there is any expired model*/
            foreach (var kvp in SendCache.internalDic)
            {

                if (kvp.Value < now)
                    modelsToRemove.Add(kvp.Key);
            }

            modelsToRemove.ForEach(key =>
            {
                //remove from caches
                GetCache.Remove(key);
                SendCache.Remove(key);
            });
            // -----------------
        }
    }
}