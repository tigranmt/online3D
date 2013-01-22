using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MongoDB.Driver;
using MongoDB.Driver.Builders;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using System.Collections;
using System.Configuration;

namespace online3D.Models
{
    public class MongoDataAccess : IData
    {
      

        public MongoDataAccess()
        {
                  
        }


        /// <summary>
        /// Generates ModelInfo from provided Bson document object
        /// </summary>
        /// <param name="bson"></param>
        /// <param name="verticesToo"></param>
        /// <returns></returns>
        private ModelInfo ModelInfoFromBson(BsonDocument bson, bool verticesToo = true)
        {
            ModelInfo mi = new ModelInfo();
            mi.ModelName =  bson["ModelName"].AsString;
            mi.Size = bson["Size"].AsInt32;
            mi.ID = bson["ID"].AsString;
            mi.Format = bson["Format"].AsString;
            mi.VertexCount = bson["VertexCount"].AsInt32;
            mi.Color = bson["Color"].AsInt32;
            mi.User = bson["User"].AsString;
            mi.ModelImage = bson["ModelImage"].AsString;

            if (verticesToo)
            {
                var vertices = new List<Vertex>();

                var bsons = bson["Vertices"].AsBsonArray;
                for (int i = 0; i < bsons.Count; i += 3)
                {
                    vertices.Add(new Vertex(bsons[i].AsDouble,
                                                    bsons[i + 1].AsDouble,
                                                            bsons[i + 2].AsDouble));
                }
                mi.Vertices = vertices;
            }

            return mi;
        }


        /// <summary>
        /// Generates Bson document from provided ModelInfo object
        /// </summary>
        /// <param name="mi"></param>
        /// <returns></returns>
        private BsonDocument BsonFromModelInfo(ModelInfo mi)
        {
            var bson = new BsonDocument();
            bson["ModelName"] = mi.ModelName;
            bson["Size"] = mi.Size;
            bson["ID"] = mi.ID;
            bson["Format"] = mi.Format;
            bson["VertexCount"] = mi.VertexCount;
            bson["Color"] = mi.Color;
            bson["User"] = mi.User;
            bson["ModelImage"] = mi.ModelImage;

            var array = BsonArrayFromEnumerable(mi.Vertices);

            bson.Add("Vertices", array);
            return bson;

        }


        /// <summary>
        /// Generates BsonArray object from provided stream of vertices
        /// </summary>
        /// <param name="vertices"></param>
        /// <returns></returns>
        private BsonArray BsonArrayFromEnumerable(IEnumerable<Vertex> vertices)
        {
            var array = new BsonArray(vertices.Count());
            foreach (var v in vertices)
            {
                array.Add(BsonValue.Create(v.x));
                array.Add(BsonValue.Create(v.y));
                array.Add(BsonValue.Create(v.z));
            }
            return array;
        }

        /// <summary>
        /// Saves model in Mongo DB
        /// </summary>
        /// <param name="mi"></param>
        /// <returns></returns>
        public bool SaveModel(ModelInfo mi)
        {
            try
            {
                var unique = mi.ID.Split('/').Last();   //get last string (uniqeud ID) in the path     
                var collection = ReadCollection(unique); //get collection
                var savedDocument = ReadDocument(unique, mi.ModelName);
                if (savedDocument != null)
                {
                    var bsonArraySaved = savedDocument["Vertices"].AsBsonArray;
                    var bsonArrayNew = BsonArrayFromEnumerable(mi.Vertices);
                    bsonArraySaved.AddRange(bsonArrayNew);
                    collection.Save(savedDocument); //update document
                   
                }
                else
                {
                    // a NEW document                  
                    savedDocument = BsonFromModelInfo(mi);       //generate BSON document
                    collection.Insert(savedDocument);   //insert
                }

               
                return true;
            }
            catch (Exception ex)
            {
                return false;
            }
        }


        /// <summary>
        /// Reads Bson document from specified collection and model name
        /// </summary>
        /// <param name="collectionID">Collection name</param>
        /// <param name="modelName">Model name inside collection</param>
        /// <returns></returns>
        public BsonDocument ReadDocument(string collectionID, string modelName)
        {
            var query = Query.EQ("ModelName", modelName);
            var collection = ReadCollection(collectionID);
            return collection.FindOne(query);
        }

        /// <summary>
        /// Reads ModelInfo object form specified collection and nodel name
        /// </summary>
        /// <param name="collectionID">Collection name</param>
        /// <param name="modelName">Model name inside collection</param>
        /// <returns></returns>
        public ModelInfo ReadModel(string collectionID, string modelName)
        {
            var bson = ReadDocument(collectionID, modelName);
            return ModelInfoFromBson(bson);
        }



        /// <summary>
        /// Gets database
        /// </summary>
        /// <returns></returns>
        private MongoDatabase GetDataBase()
        {
            #if DEBUG
                var connectionString = "mongodb://localhost:27017";
                var dataBaseName = "models";
                var client = new MongoClient(connectionString);
                var server = client.GetServer();                   //connect to server
                return server.GetDatabase(dataBaseName);           //get or create database                
            #else
                var connectionString = ConfigurationManager.AppSettings.Get("(MONGOHQ_URL|MONGOLAB_URI)");
                return MongoDatabase.Create(connectionString);
            #endif
         
        }


        private MongoCollection<BsonDocument> ReadCollection(string collectionKey)
        {
            var db = GetDataBase();
            return db.GetCollection<BsonDocument >(collectionKey); //return collection of models           
        }


      

        /// <summary>
        /// Read models from the specified collecion
        /// </summary>
        /// <param name="collectionID"></param>
        /// <param name="verticesToo"></param>
        /// <returns></returns>
        public IEnumerable<ModelInfo> ReadModelCollection(string collectionID, bool verticesToo =true)
        {
            var mongoCollection = ReadCollection(collectionID);
            var bsons = mongoCollection.FindAll();
            var models = new List<ModelInfo>();

            //desirialize 
            foreach (var bson in bsons)
            {
                var m = ModelInfoFromBson(bson, verticesToo);
                models.Add(m);            
            }

            return models;
        }


        /// <summary>
        /// Reads the colleciton of all models saved under specified user name
        /// </summary>
        /// <param name="username">Name fo the user whom models hat to be found</param>
        /// <returns></returns>
        public IEnumerable ReadUserModelCollection(string username)
        {
            var db = GetDataBase();
            
            //get all collection names, except system reserved ones
            var collectionNames = db.GetCollectionNames().Where(name=>!name.StartsWith("system."));

            List<ModelInfo> userModels = new List<ModelInfo>();
            foreach (var name in collectionNames)
            {
                var dbModels = ReadModelCollection(name, false);

                //check if the models is the model of the specified like parameter user
                userModels.AddRange(dbModels.Where(m => m.User == username));
            }

            var group = userModels.GroupBy(g=>g.ID);
            return group;
        }
    }
}