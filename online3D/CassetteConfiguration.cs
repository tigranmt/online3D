using Cassette;
using Cassette.Scripts;
using Cassette.Stylesheets;

namespace online3D
{
    /// <summary>
    /// Configures the Cassette asset bundles for the web application.
    /// </summary>
    public class CassetteBundleConfiguration : IConfiguration<BundleCollection>
    {
        public void Configure(BundleCollection bundles)
        {

            /*Add bundles for minification and compression */

            //CSS
            bundles.Add<StylesheetBundle>("Content");

            //shared js files 
            bundles.Add<ScriptBundle>("Scripts/Shared");

            //js files used on first (intro) screen 
            bundles.Add<ScriptBundle>("Scripts/Intro");

            //js files used in 3D view 
            bundles.Add<ScriptBundle>("Scripts/View");
            /**********************/
        }
    }
}