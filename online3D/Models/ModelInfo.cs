using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Drawing;

namespace online3D.Models
{   
    /// <summary>
    /// The base for model information
    /// </summary>
    public sealed class ModelInfo
    {
        public string ID { get; set; }
        public string ModelName{get;set;}
        public int    Size{get;set;}
        public string Format { get; set; }
        public List<string> Vertices { get; set; }
        public List<string> FaceColors { get; set; }
        public int VertexCount { get; set; }
        public int Color { get; set; }
        public string User { get; set; }
        public string ModelImage{get;set;}
        public string SessionName { get; set; }
        public DateTime SavedOn { get; set; }
        public DateTime ExpiresOn { get; set; }
        public List<Note> Notes { get; set; }
      
        
        /// <summary>
        /// Clones only properties and not coollections
        /// </summary>
        /// <returns></returns>
        public ModelInfo LightClone()
        {
            return new ModelInfo { ID = this.ID, ModelName = this.ModelName, Format = this.Format, Size = this.Size, VertexCount = this.VertexCount, Color = this.Color, User = this.User, SessionName = this.SessionName};
        }
    }
}