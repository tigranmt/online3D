using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.IO;

namespace online3D.Models
{
    public static class LinkGenerator
    {

        public static string GenerateTempLink(ModelInfo mi, HttpRequestBase  request)
        {
            var tempName = Path.GetFileNameWithoutExtension(Path.GetTempFileName());
#if DEBUG
            var baseUrl = request.Url.GetLeftPart(UriPartial.Authority);

#else
            var baseUrl = request.Url.Scheme + "//" + request.Url.Host;
#endif
            return baseUrl + "/" + mi.Format + "/LoadModel/" + tempName;
            

        }
    }
}