using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;

namespace online3D.Models
{
    interface IBase
    {
        bool Save(ModelInfo mi);
        object GetUniqueID(ModelInfo mi);
    }
}
