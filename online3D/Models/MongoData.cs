﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using MongoDB.Driver;
using MongoDB.Driver.Builders;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using System.Collections;
using System.Configuration;
using System.Text;
using System.Globalization;
using online3D.Helpers;
using System.Web.Script.Serialization;
using System.Runtime.Serialization.Json;

namespace online3D.Models
{
    public class MongoDataAccess : IData
    {

        private const char SEPARATOR = '$';
        private const char SEPARATOR_NOTES = '#';

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
            mi.ModelName = bson["ModelName"].AsString;
            mi.Size = bson["Size"].AsInt32;
            mi.ID = bson["ID"].AsString;
            mi.Format = bson["Format"].AsString;
            mi.VertexCount = bson["VertexCount"].AsInt32;
            mi.Color = bson["Color"].AsInt32;
            mi.User = bson["User"].AsString;
            mi.ModelImage = Compressor.Decompress(bson["ModelImage"].AsString);
            mi.SessionName = bson["SessionName"].ToString();
           

          
            DateTime dt = default(DateTime);
            if (DateTime.TryParse(bson["SavedOn"].ToString(),System.Globalization.CultureInfo.InvariantCulture, DateTimeStyles.None, out dt))
                mi.SavedOn = dt;
          
            if (verticesToo)
            {
                var deCompressed = Compressor.Decompress(bson["Vertices"].AsString).Split(new char[]{SEPARATOR}, StringSplitOptions.RemoveEmptyEntries);
                var vertices = new List<string>();
                for (int i = 0; i < deCompressed.Length; i ++)
                    vertices.Add(deCompressed[i]);

                mi.Vertices = vertices;



                var notesString = bson["Notes"].AsString.Split(new char[] { SEPARATOR_NOTES }, StringSplitOptions.RemoveEmptyEntries);
                var notes = new List<Note>();
                for (int i = 0; i < notesString.Length; i++)
                {
                    try
                    {
                        notes.Add(JsonHelper.JsonDeserialize<Note>(notesString[i]));
                    }
                    catch (Exception ex)
                    {
                        LogEntry.logger.FatalException("Decompressing note " + i, ex);
                    }
                }
                mi.Notes = notes;
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
            bson["ModelImage"] = Compressor.Compress(mi.ModelImage);
            bson["SessionName"] = mi.SessionName;           
            bson["SavedOn"] = mi.SavedOn.ToString(System.Globalization.CultureInfo.InvariantCulture);

            var array = BsonArrayFromEnumerable(mi.Vertices);
            bson.Add("Vertices", array);

            var notes = BsonArrayFromEnumerableNotes(mi.Notes);
            bson.Add("Notes", notes);

            return bson;

        }

        private void UpdateBsonInfo(BsonDocument bson, ModelInfo mi)
        {
            bson["ModelName"] = mi.ModelName;
            bson["Size"] = mi.Size;
            bson["ID"] = mi.ID;
            bson["Format"] = mi.Format;
            bson["VertexCount"] = mi.VertexCount;
            bson["Color"] = mi.Color;
            bson["User"] = mi.User;
            bson["ModelImage"] = Compressor.Compress(mi.ModelImage);
            bson["SessionName"] = mi.SessionName;
            bson["SavedOn"] = mi.SavedOn.ToString(System.Globalization.CultureInfo.InvariantCulture);

            var array = BsonArrayFromEnumerable(mi.Vertices);
            bson["Vertices"] =  array;

            var notes = BsonArrayFromEnumerableNotes(mi.Notes);
            bson["Notes"] =  notes;

        }


        private BsonString BsonArrayFromEnumerableNotes(IEnumerable<Note> notes)
        {
            StringBuilder sb = new StringBuilder();
            foreach (var n in notes)
            {
                if(n.NoteText.Length > 300)
                    n.NoteText = n.NoteText.Substring(0, 300);
                
                n.NoteText = n.NoteText.Replace(SEPARATOR_NOTES, ' ');
                 
                sb.Append(JsonHelper.JsonSerializer<Note>(n));
                sb.Append(SEPARATOR_NOTES);

            }

           
            return new BsonString(sb.ToString());
        }


        /// <summary>
        /// Generates BsonArray object from provided stream of vertices
        /// </summary>
        /// <param name="vertices"></param>
        /// <returns></returns>
        private BsonString BsonArrayFromEnumerable(IEnumerable<string> vertices)
        {
            StringBuilder sb = new StringBuilder();
            foreach (var v in vertices)
            {
                sb.Append(v);
                sb.Append(SEPARATOR);
            }

            var compressed = Compressor.Compress(sb.ToString());
            return new BsonString(compressed);
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
                mi.SavedOn = DateTime.Now;

                if (savedDocument != null)
                {
                    UpdateBsonInfo(savedDocument, mi); 

                    /*var bsonArraySaved = savedDocument["Vertices"].AsString;
                    var bsonArrayNew = BsonArrayFromEnumerable(mi.Vertices);
                    bsonArraySaved +=bsonArrayNew;*/
                    collection.Save(savedDocument); //update document
                }
                else
                {
                    // a NEW document                  
                         //generate BSON document
                    savedDocument = BsonFromModelInfo(mi); 
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
                var connectionString = ConfigurationManager.AppSettings.Get("MONGOLAB_URI");
                var url = new MongoUrl(connectionString);
                var client = new MongoClient(url);
                var server = client.GetServer();              //connect to server
                return server.GetDatabase(url.DatabaseName);  //get or create database 
#endif

        }



      

        private MongoCollection<BsonDocument> ReadCollection(int collectionIndex)
        {
            var db = GetDataBase();
            var names = db.GetCollectionNames().Where(n => !n.StartsWith("system"));

            int collectionCount = names.Count();
            if (collectionCount == 0 || collectionIndex >= collectionCount)
                return null;

            var name = names.ElementAt(collectionIndex);
            return ReadCollection(name);
        }

        private MongoCollection<BsonDocument> ReadCollection(string collectionKey)
        {
            var db = GetDataBase();
            return db.GetCollection<BsonDocument>(collectionKey); //return collection of models      
        }


        /// <summary>
        /// Read models from the specified by index collection
        /// </summary>
        /// <param name="collectionID"></param>
        /// <param name="verticesToo"></param>
        /// <returns></returns>
        public IEnumerable<ModelInfo> ReadModelCollection(int collectionIndex, bool verticesToo = true)
        {
            var mongoCollection = ReadCollection(collectionIndex);
            if (mongoCollection == null)
                return null;
            var bsons = mongoCollection.FindAll();
            return GetModelsFromBsons(bsons, verticesToo);
        }




        /// <summary>
        /// Read models from the specified collecion
        /// </summary>
        /// <param name="collectionID"></param>
        /// <param name="verticesToo"></param>
        /// <returns></returns>
        public IEnumerable<ModelInfo> ReadModelCollection(string collectionID, bool verticesToo = true, int modelIndex = -1)
        {
            var mongoCollection = ReadCollection(collectionID);
            IEnumerable<BsonDocument> bsons = null;
            if (modelIndex < 0)
                bsons = mongoCollection.FindAll();
            else
                bsons = mongoCollection.FindAll().Skip(modelIndex).Take(1);
            return GetModelsFromBsons(bsons, verticesToo);
        }


        /// <summary>
        /// Generates ModelInfo list from the BsonDocuments cursor
        /// </summary>
        /// <param name="bsons"></param>
        /// <param name="verticesToo"></param>
        /// <returns></returns>
        private IEnumerable<ModelInfo> GetModelsFromBsons(IEnumerable<BsonDocument> bsons, bool verticesToo = true)
        {
            var models = new List<ModelInfo>();
            //desirialize 
            foreach (var bson in bsons)
            {
                try
                {
                    var m = ModelInfoFromBson(bson, verticesToo);
                    models.Add(m);
                }
                catch (Exception ex)
                {
                    LogEntry.logger.ErrorException("Error on loading bson for model", ex);
                }
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
            var collectionNames = db.GetCollectionNames().Where(name => !name.StartsWith("system."));

            List<ModelInfo> userModels = new List<ModelInfo>();
            foreach (var name in collectionNames)
            {
                var dbModels = ReadModelCollection(name, false);

                //check if the models is the model of the specified like parameter user
                userModels.AddRange(dbModels.Where(m => m.User == username));
            }

            // Get only fist element in every document, as we need only basic (passport) information 
            // which is present in any model
            var group = userModels.GroupBy(g => g.ID).Select(x => x.First());

            return group;
        }



        /// <summary>
        /// Gets the image of the given user's session name
        /// </summary>
        /// <param name="username"></param>
        /// <param name="sessionname"></param>
        /// <returns></returns>
        public string GetSessionImage(string username, string sessionname)
        {
            var db = GetDataBase();

            //get all collection names, except system reserved ones
            var collectionNames = db.GetCollectionNames().Where(name => !name.StartsWith("system."));

            List<ModelInfo> userModels = new List<ModelInfo>();
            foreach (var name in collectionNames)
            {
                //get collection 
                var dbModels = ReadModelCollection(name, false);

                //find all models among collection that have given user and session name 
                var userSessionModel = dbModels.Where(m => m.User == username && m.SessionName == sessionname && m.ModelImage != null).FirstOrDefault();

                //found one, so return
                if (userSessionModel != null)
                    return userSessionModel.ModelImage;
            }
            return string.Empty;
        }


        public string GetLinkToSession(string username, string sessionname)
        {
            var db = GetDataBase();

            //get all collection names, except system reserved ones
            var collectionNames = db.GetCollectionNames().Where(name => !name.StartsWith("system."));

            List<ModelInfo> userModels = new List<ModelInfo>();
            foreach (var name in collectionNames)
            {
                //get collection 
                var dbModels = ReadModelCollection(name, false);                

                //find all models among collection that have given user and session name 
                var userSessionModel = dbModels.Where(m => m.User == username && m.SessionName == sessionname).FirstOrDefault();

                //found one, so return
                if (userSessionModel != null)
                    return userSessionModel.ID;
            }
            return string.Empty;
        }


        /// <summary>
        /// removes specified colelction from the base
        /// </summary>
        /// <param name="collectionID"></param>
        /// <returns></returns>
        public bool DeleteModelCollection(string collectionID)
        {
            var db = GetDataBase();
            var collection = db.GetCollection(collectionID);
            collection.Drop();

            return true;
        }

    }
}