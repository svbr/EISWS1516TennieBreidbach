/* TODO
Alles was in der REST SPEZ. steht implementieren
Datenstrukturen
*/
var http = require('http');
var express = require('express');
var bodyparser = require('body-parser');

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var jsonParser = bodyparser.json();
var app = express();
var server = http.createServer(app);
app.use(jsonParser);

//var monk = require('monk');
// Wo liegt die DB?
//var db = monk('localhost:27017/datenbankname');

// TODO 404 abfangen


var url = 'mongodb://localhost:27017/user';
MongoClient.connect(url, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to server.");
  db.close();
});
// TEST
/*app.post('/test', function(req, res){
    var test = req.body;
    MongoClient.connect(url, function(err, db) {
        var collection = db.collection("test");
        collection.insert(test, function(err, res){
            if (err) {
                console.log(err);
            } else {
                console.log('blub');
                console.log("Post ist angekommen");
                console.log(test.test);

        }
        db.close();
        });
        res.send(test);
    });
});

app.get('/test', function(req, res){
    MongoClient.connect(url, function(err, db){
        var collection = db.collection("test");
        collection.findOne({key: "1"}, function(err, item){
            if(err){
                console.log("err");
            } else {
                console.log(item);
                res.send(item);
            }

        });

    });

});
*/
// TEST ENDE

// USER
  // Post
  app.post('/user', function(req, res){
      var user = req.body;
      MongoClient.connect(url, function(err, db) {
          var collection = db.collection("user");
          collection.insert(user, function(err, res){
              if (err) {
                  console.log(err);
              } else {
                  console.log("Post ist angekommen");
                  console.log(user);

          }
          db.close();
          });
          res.send(user);
      });
  });
  // Put
  // TODO user an onupdate übergeben
  app.put('/user', function(req,res){
    var user = req.body;
    MongoClient.connect(url, function(err, db){
      var collection = db.collection("user");
      collection.updateOne(
        {"user" : "Username"},
        {
          $set: {"Vegenarier" : "Nein"}
        }, function(err, results){
          if(err){
            console.log(err);
          }else{
            console.log(results);
            console.log("Put hat funktioniert");
            }
          }
        );
      });
  });
  // GET
  app.get('/user', function(req, res){
      MongoClient.connect(url, function(err, db){
          var collection = db.collection("user");
          collection.findOne({key: "2"}, function(err, item){
          //collection.find({key: user}, function(err, item){
              if(err){
                  console.log("err");
              } else {
                  console.log(item);
                  res.send(item);
              }

          });

      });

  });

  // DELETE
  app.delete('/user',function(){
    MongoClient.connect(url, function(err, db){
        var collection = db.collection("user");
        collection.deleteOne(
          {"user" : "Username"},
          function(err, results){
            if(err){
            console.console.log('err');
          }else{
            console.log(results);
            console.log("delete hat funktioniert");
          }
          }

        );

    });
  });


// WOCHENPLAN
// /user/id/wochenplan
  // PUT
  // GET

// EINKAUFSZETTEL
// /user/id/einkaufszettel
  // PUT
  // GET

// REZEPTE
  // POST
  app.post('/rezepte', function(req, res){
      var rezept = req.body;
      MongoClient.connect(url, function(err, db) {
          var collection = db.collection("rezepte");
          collection.insert(rezept, function(err, res){
              if (err) {
                  console.log(err);
              } else {
                  console.log("Post ist angekommen");
                  //console.log(test.test);

          }
          db.close();
          });
          res.send(rezept);
      });
  });
  // PUT
  // DELETE

// LEBENSMITTEL
  // POST
  // PUT
  // DELETE

app.listen(8080);
console.log('Port: 8080');
