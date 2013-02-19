using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using online3D.Models;

namespace online3D.Helpers
{
    public static class CacheChecker
    {
        static System.Timers.Timer checkTimer = null;
        
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

        public static void Stop()
        {
            checkTimer.Stop();
            checkTimer.Dispose();
        }


        static void checkTimer_Elapsed(object sender, System.Timers.ElapsedEventArgs e)
        {
            //check in cash if there is any model expired
            List<string> modelsToRemove = new List<string>();
            foreach (var kvp in ModelHolder.internalDic)
            {

                if (kvp.Value.ExpiresOn < DateTime.Now)
                    modelsToRemove.Add(kvp.Key);
            }

            modelsToRemove.ForEach(key =>
            {
                ModelHolder.Remove(key);
            });
            // -----------------
        }
    }
}