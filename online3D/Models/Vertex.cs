using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace online3D.Models
{
    public class Vertex
    {
        public double x { get; set; }
        public double y { get; set; }
        public double z { get; set; }

        public Vertex(){
        }

        public Vertex(double _x, double _y, double _z)
        {
            x = _x;
            y = _y;
            z = _z;
        }

      
    }
}