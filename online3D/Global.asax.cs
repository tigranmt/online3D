using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Routing;
using online3D.Helpers;
using online3D.Models;

namespace ModelViewer3D
{
    // Note: For instructions on enabling IIS6 or IIS7 classic mode, 
    // visit http://go.microsoft.com/?LinkId=9394801

    public class MvcApplication : System.Web.HttpApplication
    {
       

        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
          //  filters.Add(new AuthenticationRequiered());
            //filters.Add(new RequireHttpsAttribute()); 
            filters.Add(new HandleErrorAttribute());
        }

        public static void RegisterRoutes(RouteCollection routes)
        {
            routes.IgnoreRoute("{resource}.axd/{*pathInfo}");

            routes.MapRoute(
                "Default", // Route name
                "{controller}/{action}/{id}", // URL with parameters
                new { controller = "Intro", action = "Start", id = UrlParameter.Optional } // Parameter defaults
            );

        }

        protected void Application_Start()
        {
            //leave only Razor engine
            ViewEngines.Engines.Clear();
            ViewEngines.Engines.Add(
                    new RazorViewEngine());

            AreaRegistration.RegisterAllAreas();

            RegisterGlobalFilters(GlobalFilters.Filters);
            RegisterRoutes(RouteTable.Routes);

            this.Error += new EventHandler(MvcApplication_Error);

            CacheChecker.Start();
           
            
        }

        protected void Application_End()
        {
            CacheChecker.Stop();
        }

        

       

        void MvcApplication_Error(object sender, EventArgs e)
        {
            Exception LastOneError = Server.GetLastError();

            try
            {
                if (LastOneError != null)
                    LogEntry.logger.FatalException("Unhandled exception", LastOneError);

            }
            catch (Exception ex)
            {
                LogEntry.logger.ErrorException("Unhandled error: ", ex);
            }

        }


        
    }
}