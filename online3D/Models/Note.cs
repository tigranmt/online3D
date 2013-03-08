using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace online3D.Models
{
    public class Note 
    {
        public string NoteText { get; set; }
        public Vertex NoteVertex { get; set; }

    }
}
