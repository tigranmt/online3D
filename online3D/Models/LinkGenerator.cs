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
            var baseUrl = request.Url.GetLeftPart(UriPartial.Authority);

            //base URL  + Controller(Format) + LoadModel(Action) + Unique ID
            return baseUrl + "/" + mi.Format + "/LoadModel/" + tempName;
        }
    }
}