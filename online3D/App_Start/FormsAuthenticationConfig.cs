using System.Web;
using online3D.App_Start;
using Microsoft.Web.Infrastructure.DynamicModuleHelper;
using AspNetHaack;

[assembly: PreApplicationStartMethod(typeof(FormsAuthenticationConfig), "Register")]
namespace online3D.App_Start {
    public static class FormsAuthenticationConfig {
        public static void Register() {
            DynamicModuleUtility.RegisterModule(typeof(SuppressFormsAuthenticationRedirectModule));
        }
    }
}
