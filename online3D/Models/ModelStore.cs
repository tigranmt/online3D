using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace online3D.Models
{
    public class MeshStore
    {
        /// <summary>
        /// Vertex data holder
        /// </summary>
        //public class Vertex 
        //{
        //    public double X {get;set;}
        //    public double Y {get;set;}
        //    public double Z {get;set;}
        //}

        /// <summary>
        /// Name of the model
        /// </summary>
        public string ModelName { get; set; }

        /// <summary>
        /// Extension (format) of the file
        /// </summary>
        public string FileFormat { get; set; }


       // public List<Vertex> Vertices { get; set; }
    }
}