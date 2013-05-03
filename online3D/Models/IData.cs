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
        bool DeleteModelCollection(string collectionOfModels);
        string GetLinkToSession(string username, string sessionname);
        string GetSessionImage(string username, string sessionname);
        
        ModelInfo ReadModel(string collectionID, string modelID);
        IEnumerable<ModelInfo> ReadModelCollection(string collectionID,bool verticesToo =true, int modelIndex = -1);
        IEnumerable<ModelInfo> ReadModelCollection(int collectionIndex, bool verticesToo = true);
        IEnumerable ReadUserModelCollection(string username);
       
    }
}