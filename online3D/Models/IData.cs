using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Collections;

namespace online3D.Models
{
    public interface IData
    {
        bool SaveModel(ModelInfo mi);
        ModelInfo ReadModel(string collectionID, string modelID);
        IEnumerable<ModelInfo> ReadModelCollection(string collectionID,bool verticesToo =true, int modelIndex = -1);
        IEnumerable ReadUserModelCollection(string usename);
    }
}