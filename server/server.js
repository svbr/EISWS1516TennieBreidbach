/* TODO
Alles was in der REST SPEZ. steht implementieren
Datenstrukturen
*/
var http = require('http');
var express = require('express');
var bodyparser = require('body-parser');

var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
//für die Id überprüfung bei mongodb
var ObjectID = require('mongodb').ObjectID;
//um den asynchronen Verlauf zu ermöglichen
var async = require('async');

var jsonParser = bodyparser.json();
var app = express();
var server = http.createServer(app);
app.use(jsonParser);

//var monk = require('monk');
// Wo liegt die DB?
//var db = monk('localhost:27017/datenbankname');

// TODO 404 abfangen


var url = 'mongodb://localhost:27017/user';
MongoClient.connect(url, function (err, db) {
    assert.equal(null, err);
    console.log("Connected correctly to server.");
    db.close();
});

// USER
// Post
app.post('/user', function (req, res) {
    var user = req.body;
    MongoClient.connect(url, function (err, db) {
        console.log(user);
        var collection = db.collection("user");

        //überprüfen ob der Benutzer schon vorhanden ist anhand dem Benutzernamen und der Email
        collection.findOne({
            $or: [{
                Benutzername: user.Benutzername
            }, {
                Email: user.Email
            }]
        }, function (err, item) {
            if (err) {
                console.log("err");
            }
            if (item) {
                //Benutzer schon vorhanden

                console.log(item);
                res.status("406").type("text").send("Der User mit dem Benutzernamen ist schon vorhanden!");

            } else {
                //Benuzter nicht vorhanden, Benutzer wird angelegt

                collection.insert(user, function (err, results) {
                    console.log(results);
                    if (err) {
                        console.log(err);
                        res.status("404").type("text").send("user konnte nicht hinzugefügt werden! Status überarbeiten!");
                    } else {
                        console.log("Post ist angekommen");
                        console.log(user);
                        res.send(user);
                    }
                });
            }
            db.close();
        });
    });
});
// Put
// TODO user an onupdate übergeben
//keine _id im body übergeben!!!
app.put('/user/:id', function (req, res) {
    var neuerUser = req.body;
    var id = req.params.id;
    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("user");
        collection.updateOne({
            _id: ObjectID.ObjectId(id)
        }, {
            $set: user
        }, function (err, results) {
            if (err) {
                console.log(err);
            }
            console.log(results);
            if (results.result.n == 0) {
                console.log("keine ID gefunden!");
                res.status("404").type("text").send("Der User mit der ID " + id + " ist nicht vorhanden!");
            } else {
                console.log("Put hat funktioniert");
                res.status(200).type("application/json").send(user);
            }
            db.close();
        });
    });
});
// GET
app.get('/user/:id', function (req, res) {
    var id = req.params.id;

    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("user");
        collection.findOne({
            _id: ObjectID.ObjectId(id)
        }, function (err, item) {
            if (err) {
                console.log("err");

            }
            if (item) {
                console.log(item);
                res.send(item);
            } else {
                res.status("404").type("text").send("Der User mit der ID " + id + " ist nicht vorhanden!");
            }
            db.close();
        });
    });
});

// DELETE
app.delete('/user/:id', function (req, res) {
    var id = req.params.id;

    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("user");
        collection.deleteOne({
            _id: ObjectID.ObjectId(id)
        }, function (err, results) {
            if (err) {
                console.console.log('err');
            }
            console.log(results);
            if (results.result.n == 0) {
                res.status("404").type("text").send("Der User mit der ID " + id + " ist nicht vorhanden!");
            } else {
                console.log("delete hat funktioniert");
                res.status("200").type("text").send("Der User mit der ID " + id + "wurde gelöscht!");
            }
            db.close();
        });
    });
});
// Get /user
// um alle user abzurufen 
app.get('/users', function (req, res) {
    var data = [];
    MongoClient.connect(url, function (err, db) {
        db.collection('user', function (err, collection) {
            collection.find({}, function (err, cursor) {
                var i = 0;
                cursor.each(function (err, item) {
                    if (item == null && i == 0) {
                        console.log("Kein User vorhanden");
                        res.status('404').type('text').send("Es sind keine User vorhanden!")
                    } else if (item == null) {
                        console.log("Get User hat funktioniert");
                        res.send(data);
                    } else {
                        data.push(item);
                        i++;
                        console.log(i);
                    }
                });
            });
        });
    });
});

// WOCHENPLAN
// /user/id/wochenplan
// POST
// TODO: überprüfung ob es schon einen Wochenplan zu dieser ID gibt 
app.post('/user/:id/wochenplan', function (req, res) {
    var wochenplan = {
        "wochenplan": []
    };
    wochenplan.userid = req.params.id;
    var id = req.params.id;

    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("wochenplan");
        collection.findOne({
            "userid": id
        }, function (err, item) {
            console.log(item);
            if (item == null) {
                collection.insert(wochenplan, function (err, res) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Post ist angekommen");
                        console.log(wochenplan);
                    }
                    db.close();
                });
                res.send(wochenplan);
            } else {
                res.status(406).type('text').send("Der Wochenplan ist schon für den Bentuzer " + req.params.id + " angelegt");
            }
        });
    });
});

// PUT
//keine _id im body übergeben!!!
app.put('/user/:id/wochenplan', function (req, res) {
    var id = req.params.id;
    var neuerTag = req.body;
    var neuerWochenplan;
    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("wochenplan");

        async.series([
            //der Wochenplan wird aus der datenbank gehohlt, um die Tage in den Wochenplan anzuhängen
            function (callback) {
                collection.findOne({
                    userid: id
                }, function (err, item) {
                    if (err) {
                        console.log("err");
                    }
                    if (item) {
                        console.log(item);
                        neuerWochenplan = item;
                        callback();
                    } else {
                        res.status("404").type("text").send("Der User mit der ID " + id + " ist nicht vorhanden oder es wurde noch kein Wochenplan erstellt!");
                    }
                });
            },
            //die länge des Wochenplans wird ermittelt und daraufhin das Objekt in den Wochenplan angehangen und in der
            //Datenbak gespeichert
            function (callback) {
                var length = neuerWochenplan.wochenplan.length;
                neuerWochenplan.wochenplan[length] = neuerTag;
                collection.updateOne({
                    userid: id
                }, {
                    $set: neuerWochenplan
                }, function (err, results) {
                    if (err) {
                        console.log(err);
                    }
                    console.log(results);
                    if (results.result.n == 0) {
                        console.log("keine ID gefunden!");
                        res.status("404").type("text").send("Der User mit der ID " + id + " ist nicht vorhanden oder hat noch keinen Wochenplan erstellt!");
                    } else {
                        console.log("Put hat funktioniert");
                        callback();
                    }
                });
            }
        ], function () {
            res.status(200).type("application/json").send(neuerWochenplan);
            db.close();
        });
    });
});
// GET
app.get('/user/:id/wochenplan', function (req, res) {
    var id = req.params.id;

    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("wochenplan");
        collection.findOne({
            userid: id
        }, function (err, item) {
            if (err) {
                console.log("err");
            }
            if (item) {

                console.log(item);
                res.send(item);
            } else {
                res.status("404").type("text").send("Der User mit der ID " + id + " ist nicht vorhanden oder es wurde noch kein Wochenplan erstellt!");
            }
            db.close();
        });
    });
});

// EINKAUFSZETTEL
// /user/id/einkaufszettel
// POST

app.post('/user/:id/einkaufszettel', function (req, res) {
    var id = req.params.id;
    var einkaufszettel = {
        "Montag": [],
        "Dienstag": [],
        "Mittwoch": [],
        "Donnerstag": [],
        "Freitag": [],
        "Samstag/Sonntag": []
    };
    einkaufszettel.userid = id;
    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("einkaufszettel");
        collection.findOne({
            "userid": id
        }, function (err, item) {
            console.log(item);
            if (item == null) {
                collection.insert(einkaufszettel, function (err, res) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("Post ist angekommen");
                        console.log(einkaufszettel);
                    }
                    db.close();
                });
                res.send(einkaufszettel);
            } else {
                res.status(406).type('text').send("Der Einkaufszettel ist schon für den Bentuzer " + req.params.id + " angelegt");
            }
        });
    });
});
// PUT
app.put('/user/:id/einkaufszettel', function (req, res) {
    var id = req.params.id;
    var neuerEinkaufszettel = req.body;

    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("einkaufszettel");
        collection.updateOne({
            userid: id
        }, {
            $set: neuerEinkaufszettel
        }, function (err, results) {
            if (err) {
                console.log(err);
            }
            console.log(results);
            if (results.result.n == 0) {
                console.log("keine ID gefunden!");
                res.status("404").type("text").send("Der User mit der ID " + id + " ist nicht vorhanden oder der Einkaufszettel wurde noch nicht erstellt!");
            } else {
                console.log("Put hat funktioniert");
                res.status(200).type("application/json").send(neuerEinkaufszettel);
            }
            db.close();
        });
    });


});

// GET
app.get('/user/:id/einkaufszettel', function (req, res) {
    var id = req.params.id;

    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("einkaufszettel");
        collection.findOne({
            userid: id
        }, function (err, item) {
            if (err) {
                console.log("err");
            }
            if (item) {
                console.log(item);
                res.send(item);
            } else {
                res.status("404").type("text").send("Der User mit der ID " + id + " ist nicht vorhanden oder es wurde noch kein Einkaufszettel erstellt!");
            }
            db.close();
        });
    });
});

//DELETE
app.delete('/user/:id/einkaufszettel', function (req, res) {
    var id = req.params.id;

    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("einkaufszettel");
        collection.deleteOne({
            userid: id
        }, function (err, results) {
            if (err) {
                console.console.log('err');
            }
            console.log(results);
            if (results.result.n == 0) {
                res.status("404").type("text").send("Der Einkaufszettel des Users mit der ID " + id + " ist nicht vorhanden!");
            } else {
                console.log("delete hat funktioniert");
                res.status("200").type("text").send("Der Einkaufszettel des Users mit der ID " + id + "wurde gelöscht!");
            }
            db.close();
        });
    });
});


//Lebensmittelbstand
// POST
app.post('/user/:id/lebensmittelbestand', function (req, res) {
    var lebensmittelbestand = req.body;
    var id = req.params.id;
    lebensmittelbestand.userid = id;

    MongoClient.connect(url, function (err, db) {
        db.collection("lebensmittelbestand", function (err, collection) {
            collection.findOne({
                userid: id
            }, function (err, item) {
                console.log(item);
                if (item == null) {
                    collection.insert(lebensmittelbestand, function (err, result) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("Post ist angekommen");
                            console.log(lebensmittelbestand);
                            res.send(lebensmittelbestand);
                        }
                        db.close();
                    });
                } else {
                    res.status(406).type('text').send("Der Lebensmittelbestand ist schon für den Bentuzer " + id + " angelegt");
                }
            });

        });

    });
});

//GET
app.get('/user/:id/lebensmittelbstand', function (req, res) {
    var id = req.params.id;

    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("lebensmittelbestand");
        collection.findOne({
            userid: id
        }, function (err, item) {
            if (err) {
                console.log("err");
            }
            if (item) {
                console.log(item);
                res.send(item);
            } else {
                res.status("404").type("text").send("Der User mit der ID " + id + " ist nicht vorhanden oder es wurde noch kein Lenbensmittelbestand erstellt!");
            }
            db.close();
        });
    });
});

// PUT
app.put('/user/:id/lebensmittelbestand', function (req, res) {
    var id = req.params.id;
    var neuerLebensmittelbstand = req.body;

    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("lebensmittelbestand");
        collection.updateOne({
            userid: id
        }, {
            $set: neuerLebensmittelbstand
        }, function (err, results) {
            if (err) {
                console.log(err);
            }
            console.log(results);
            if (results.result.n == 0) {
                console.log("keine ID gefunden!");
                res.status("404").type("text").send("Der User mit der ID " + id + " ist nicht vorhanden oder der Lebensmittelbestand wurde noch nicht erstellt!");
            } else {
                console.log("Put hat funktioniert");
                res.status(200).type("application/json").send(neuerLebensmittelbstand);
            }
            db.close();
        });
    });
});

//DELETE
app.delete('/user/:id/lebensmittelbestand', function (req, res) {
    var id = req.params.id;

    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("lebensmittelbestand");
        collection.deleteOne({
            userid: id
        }, function (err, results) {
            if (err) {
                console.console.log('err');
            }
            console.log(results);
            if (results.result.n == 0) {
                res.status("404").type("text").send("Der Lebensmittelbestand des Users mit der ID " + id + " ist nicht vorhanden!");
            } else {
                console.log("delete hat funktioniert");
                res.status("200").type("text").send("Der Lebensmittelbestand des Users mit der ID " + id + "wurde gelöscht!");
            }
            db.close();
        });
    });
});



// REZEPTE
// POST
app.post('/rezept', function (req, res) {
    var rezept = req.body;
    MongoClient.connect(url, function (err, db) {
        console.log(rezept);
        var collection = db.collection("rezepte");

        //überprüfen ob der Benutzer schon vorhanden ist.
        collection.findOne({
            Titel: rezept.Titel
        }, function (err, item) {
            if (err) {
                console.log("err");
            }
            if (item) {
                //Rezept schon vorhanden

                console.log(item);
                res.status("406").type("text").send("Das Rezept mit dem Titel ist schon vorhanden!");

            } else {
                //Rezept nicht vorhanden, Rezept wird angelegt

                collection.insert(rezept, function (err, results) {
                    console.log(results);
                    if (err) {
                        console.log(err);
                        res.status("404").type("text").send("Rezept konnte nicht hinzugefügt werden! Status überarbeiten!");
                    } else {
                        console.log("Post ist angekommen");
                        res.send(rezept);
                    }
                });
            }
            //db.close();
        });
    });
});
// GET
// todo: saison überprüfen --> lebensmittelliste hohlen und die einzelnen zutaten überprüfen

app.get('/rezept/:id', function (req, res) {
    var id = req.params.id;
    var data = [];
    var rezept = {};


    async.series([
        function (callback) {
            MongoClient.connect(url, function (err, db) {
                var collection = db.collection("rezepte");
                collection.findOne({
                    _id: ObjectID.ObjectId(id)
                }, function (err, item) {
                    if (err) {
                        console.log("err");
                    }
                    if (item) {
                        console.log(item);
                        rezept = item;
                        callback();
                    } else {
                        res.status("404").type("text").send("Das Rezept mit der ID " + id + "ist nicht vorhanden!");
                    }
                    db.close();
                });
            });
        },
        function (callback) {
            //liste der Zutaten über die Lebensmitteldatenbank laufen lassen 
            var data = [];
            var i;
            for (i = 0; i < rezept.Zutaten.length; i++) {
                data[i] = rezept.Zutaten[i].name;
            }

            MongoClient.connect(url, function (err, db) {
                db.collection('lebensmittel', function (err, collection) {
                    collection.find({
                        name: {
                            $in: data
                        }
                    }, function (err, item) {
                        var i = 0;
                        cursor.each(function (err, item) {
                            if (item == null && i == 0) {
                                console.log("Keine Lebensmittel vorhanden");
                                res.status('404').type('text').send("Es sind keine Lebensmittel vorhanden!")
                            } else if (item == null) {
                                console.log("Get Lebensmittel hat funktioniert");
                                callback();
                            } else {
                                data.push(item);
                                i++;
                                console.log(i);
                            }
                        });
                    });
                });
            });
        },
        function (callback) {
            var i, k;
            var d = new Date();
            var n = d.getMonth();
            var nichtInDerSaison = false;
            var rezepteNichtInDerSaison = [];
            console.log(n);

            for (i = 0; i < data.length; i++) {
                switch (n) {
                case 0:
                    if (data[i].saison.januar == "nein") {
                        nichtInDerSaison = true;
                        rezepteNichtInDerSaison.push(data[i].name)
                    }
                case 1:
                    if (data[i].saison.februar == "nein") {
                        nichtInDerSaison = true;
                        rezepteNichtInDerSaison.push(data[i].name)
                    }
                case 2:
                    if (data[i].saison.märz == "nein") {
                        nichtInDerSaison = true;
                        rezepteNichtInDerSaison.push(data[i].name)
                    }
                case 3:
                    if (data[i].saison.aprill == "nein") {
                        nichtInDerSaison = true;
                        rezepteNichtInDerSaison.push(data[i].name)
                    }
                case 4:
                    if (data[i].saison.mai == "nein") {
                        nichtInDerSaison = true;
                        rezepteNichtInDerSaison.push(data[i].name)
                    }
                case 5:
                    if (data[i].saison.juni == "nein") {
                        nichtInDerSaison = true;
                        rezepteNichtInDerSaison.push(data[i].name)
                    }
                case 6:
                    if (data[i].saison.juli == "nein") {
                        nichtInDerSaison = true;
                        rezepteNichtInDerSaison.push(data[i].name)
                    }
                case 7:
                    if (data[i].saison.august == "nein") {
                        nichtInDerSaison = true;
                        rezepteNichtInDerSaison.push(data[i].name)
                    }
                case 8:
                    if (data[i].saison.september == "nein") {
                        nichtInDerSaison = true;
                        rezepteNichtInDerSaison.push(data[i].name)
                    }
                case 9:
                    if (data[i].saison.oktober == "nein") {
                        nichtInDerSaison = true;
                        rezepteNichtInDerSaison.push(data[i].name)
                    }
                case 10:
                    if (data[i].saison.november == "nein") {
                        nichtInDerSaison = true;
                        rezepteNichtInDerSaison.push(data[i].name)
                    }
                case 11:
                    if (data[i].saison.dezember == "nein") {
                        nichtInDerSaison = true;
                        rezepteNichtInDerSaison.push(data[i].name)
                    }
                }
            }
            if (nichtInDerSaison) {
                rezept.saison = rezepteNichtInDerSaison;
            }
            callback();
        }
    ], function () {
        res.send(rezept);
    });
});
// PUT 
app.put('/rezept/:id', function (req, res) {
    var bearbeitesRezept = req.body;
    var id = req.params.id;

    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("rezepte");
        collection.updateOne({
            _id: ObjectID.ObjectId(id)
        }, {
            $set: bearbeitesRezept
        }, function (err, results) {
            if (err) {
                console.log("err");
            }
            if (results.result.n == 0) {
                console.log("keine ID gefunden!");
                res.status("404").type("text").send("Das Rezept mit der ID " + id + " ist nicht vorhanden");
            } else {
                console.log("Put hat funktioniert");
                res.status(200).type("application/json").send(bearbeitesRezept);
            }
            db.close();
        });
    });
});
// DELETE 
app.delete('/rezept/:id', function (req, res) {
    var id = req.params.id;

    MongoClient.connect(url, function (err, db) {
        var collection = db.collection("rezepte");
        collection.deleteOne({
            _id: ObjectID.ObjectId(id)
        }, function (err, results) {
            if (err) {
                console.console.log('err');
            }
            console.log(results);
            if (results.result.n == 0) {
                res.status("404").type("text").send("Das Rezept mit der ID " + id + " ist nicht vorhanden!");
            } else {
                console.log("delete hat funktioniert");
                res.status("200").type("text").send("Das Rezept mit der ID " + id + "wurde gelöscht!");
            }
            db.close();
        });
    });
});



// rezepte
// GET
// http://localhost:8080/rezepte?like=Butter+Ei&dislike=Erbsen+Emmentaler&kategorie=normal&schwierigkeitsgrad=leicht&maxDauer=30
// http://localhost:8080/rezepte?reste=Butter+Ei+Kartoffeln+Schinken&menge=200+3+500
app.get('/rezepte', function (req, res) {
    var filter = {};

    filter.kategorie = req.query.kategorie;
    filter.schwierigkeitsgrad = req.query.schwierigkeitsgrad;
    filter.maxDauer = req.query.maxDauer;

    var dislike = req.query.dislike;
    var like = req.query.like;
    var reste = req.query.reste;
    var menge = req.query.menge;
    var temp1 = [];
    var temp2 = [];
    var i, k = 0,
        t = 0;
    var alleKategorien = false;
    var allLike = false;
    var noDislike = false;
    var data = [];

    if ((filter.kategorie == undefined || filter.schwierigkeitsgrad == undefined || filter.maxDauer == undefined || dislike == undefined || like == undefined) && (reste == undefined || menge == undefined)) {
        MongoClient.connect(url, function (err, db) {
            db.collection('rezepte', function (err, collection) {
                collection.find({}, function (err, cursor) {
                    var i = 0;
                    cursor.each(function (err, item) {
                        if (item == null && i == 0) {
                            console.log("Kein Rezept vorhanden");
                            res.status('404').type('text').send("Es sind keine Rezepte vorhanden!");
                        } else if (item == null) {
                            console.log("Get Rezepte hat funktioniert");
                            res.send(data);
                        } else {
                            data.push(item);
                            i++;
                            console.log(i);
                        }
                    });
                });
            });
        });
    } else if (filter.kategorie == undefined || filter.schwierigkeitsgrad == undefined || filter.maxDauer == undefined || dislike == undefined || like == undefined) {

        var temp1 = [];
        var temp2 = [];
        var t = 0,
            i,
            k = 0;

        console.log(reste);
        console.log(menge);

        for (i = 0; i < reste.length; i++) {
            if (reste.charAt(i) == "+" || reste.charAt(i) == " ") {

                temp1[k++] = reste.slice(t, i);
                t = i + 1;

            } else if (i == reste.length - 1) {
                i++;
                temp1[k] = reste.slice(t, i);
            }
        }
        t = 0;
        k = 0;

        for (i = 0; i < menge.length; i++) {
            if (menge.charAt(i) == "+" || menge.charAt(i) == " ") {

                temp2[k++] = menge.slice(t, i);
                t = i + 1;

            } else if (i == menge.length - 1) {
                i++;
                temp2[k] = menge.slice(t, i);
            }
        }
        i = 0;

        var resteMenge = {
            reste: []
        };

        while (i < temp1.length) {
            resteMenge.reste[i] = {
                name: temp1[i],
                menge: temp2[i]
            };
            i++;
        }

        console.log(resteMenge);

        var data = [];
        var rezepteFürResteverwertung = [];
        async.series([
            function (callback) {
                MongoClient.connect(url, function (err, db) {
                    db.collection('rezepte', function (err, collection) {
                        collection.find({}, function (err, cursor) {
                            var i = 0;
                            cursor.each(function (err, item) {
                                if (item == null && i == 0) {
                                    console.log("Kein Rezept vorhanden");
                                    res.status('404').type('text').send("Es sind keine Rezepte vorhanden!");
                                } else if (item == null) {
                                    console.log("Get Rezepte hat funktioniert");
                                    callback();
                                } else {
                                    data.push(item);
                                    i++;
                                    console.log(i);
                                }
                            });
                        });
                    });
                });
            },
            function (callback) {
                //for schleife die die Rezepte durchgeht und guckt ob die Reste verbraucht werden können
                //je mehr umso besser!!!
                //1. Schleife --> Rezepte (data/i)
                //2. Schleife --> die Zutaten der Rezepte (data[i].Zutaten[k].name) && data[i].Zutaten[k].menge)
                //3. Schleife --> die Reste und deren Mengen (resteMenge.reste[t].name && resteMenge.reste[t].menge)
                var i, k, t;
                for (i = 0; i < data.length; i++) {
                    for (k = 0; k < data[i].Zutaten.length; k++) {
                        for (t = 0; t < resteMenge.reste.length; t++) {
                            if (data[i].Zutaten[k].name == resteMenge.reste[t].name && data[i].Zutaten[k].menge <= resteMenge.reste[t].menge) {
                                rezepteFürResteverwertung.push(data[i]);
                                k = data[i].Zutaten.length;
                                t = resteMenge.reste.length;
                                console.log("blub");
                                console.log(rezepteFürResteverwertung);
                            }
                        }
                    }
                }
                callback();
            }], function () {
            console.log(rezepteFürResteverwertung);
            res.send(rezepteFürResteverwertung);
        });
    } else {

        for (i = 0; i < like.length; i++) {
            if (like.charAt(i) == "+" || like.charAt(i) == " ") {

                temp1[k++] = like.slice(t, i);
                t = i + 1;

            } else if (i == like.length - 1) {
                i++;
                temp1[k] = like.slice(t, i);
            }
        }

        k = 0;
        t = 0;

        for (i = 0; i < dislike.length; i++) {
            if (dislike.charAt(i) == "+" || dislike.charAt(i) == " ") {

                temp2[k++] = dislike.slice(t, i);
                t = i + 1;

            } else if (i == dislike.length - 1) {
                i++;
                temp2[k] = dislike.slice(t, i);
            }
        }

        filter.like = temp1;
        filter.dislike = temp2;

        //damit keine Filterung bei dem like gemacht wird, wenn nichts angeben wurde
        if (filter.like.length == 0) {
            allLike = true;
        }

        //damit keine Filterung bei dem dislike gemacht wird, wenn nichts angeben wurde
        if (filter.dislike == 0) {
            Nodislike = true;
        }

        //damit alle Kategorien bei denen aufgeführt werden, die "normal" als kategorien haben, wird hier
        //der wert hier auf true gesetzt.
        if (filter.kategorie == "normal") {
            alleKategorien = true;
        }



        async.series([
            function (callback) {
                MongoClient.connect(url, function (err, db) {
                    db.collection('rezepte', function (err, collection) {
                        collection.find({}, function (err, cursor) {
                            var i = 0;
                            cursor.each(function (err, item) {
                                if (item == null && i == 0) {
                                    console.log("Kein Rezept vorhanden");
                                    res.status('404').type('text').send("Es sind keine Rezepte vorhanden!");
                                } else if (item == null) {
                                    console.log(i + " Rezepte sind eingespeichert");
                                    callback();
                                } else {
                                    data.push(item);
                                    i++;
                                    console.log(i);
                                }
                            });
                        });
                    });
                });
            },
            function (callback) {
                var i, k = 0,
                    t = 0;
                var temp = [];

                //todo: falls jemand keine like/dislike abgibt, muss das berücksichtigt werden.

                for (i = 0; i < data.length; i++) {

                    if ((data[i].Kategorie == filter.kategorie || alleKategorien) && data[i].Schwierigkeitsgrad == filter.schwierigkeitsgrad && data[i].Zeitbedarf <= filter.maxDauer) {
                        if (!allLike) {
                            k = 0;
                            while (k < data[i].Zutaten.length) {
                                t = 0;
                                while (t < filter.like.length) {
                                    if (data[i].Zutaten[k].name == filter.like[t]) { //!!
                                        temp.push(data[i]);
                                        t = filter.like.length;
                                        k = data[i].Zutaten.length;
                                    }
                                    t++;
                                }
                                k++;
                            }
                        } else {
                            console.log("allLike");
                            temp.push(data[i]);
                        }
                    }
                }
                data = temp;
                console.log("callback2");
                console.log(data);
                callback();

            },
            function (callback) {
                var i, k = 0,
                    t = 0;
                var test = false;
                var temp = [];
                if (!noDislike) {
                    for (i = 0; i < data.length; i++) {
                        test = false;
                        k = 0;
                        while (k < data[i].Zutaten.length) {
                            t = 0;
                            while (t < filter.dislike.length) {
                                if (data[i].Zutaten[k].name == filter.dislike[t]) { //!!
                                    test = true;
                                    t = filter.dislike.length;
                                    k = data[i].Zutaten.length;
                                }
                                t++;
                            }
                            k++;
                        }
                        if (test == false) {
                            temp.push(data[i]);
                        }
                    }
                    data = temp;
                    console.log("callback3");
                    //console.log(data);
                    callback();
                } else {
                    callback();
                    console.log("keine Filterung bei dislike");
                }

            }], function (err) {
            res.send(data);
        });
    }
});

// /rezept/:id/bild
// POST
app.post('/rezept/:id/bild', function (req, res) {

});

// GET
app.get('/rezept/:id/bild', function (req, res) {

});

// DELETE
app.delete('/rezepte/:id/bild', function (req, res) {

});




// LEBENSMITTEL
// POST
app.post('/lebensmittel', function (req, res) {
    var lebensmittel = req.body;

    MongoClient.connect(url, function (err, db) {
        db.collection('lebensmittel', function (err, collection) {
            collection.insert(lebensmittel, function (err, results) {
                if (err) {
                    console.log(err);
                    res.status("404").type("text").send("Lebensmittel konnte nicht hinzugefügt werden! Status überarbeiten!");
                } else {
                    console.log("Post ist angekommen");
                    res.send(lebensmittel);
                }
                db.close();
            });
        });
    });
});

// GET
app.get('/lebensmittel', function (req, res) {
    var data = [];
    MongoClient.connect(url, function (err, db) {
        db.collection('lebensmittel', function (err, collection) {
            collection.find({}, function (err, cursor) {
                var i = 0;
                cursor.each(function (err, item) {
                    if (item == null && i == 0) {
                        console.log("Kein Lebensmittel vorhanden");
                        res.status('404').type('text').send("Es sind keine Lebensmittel vorhanden!");
                    } else if (item == null) {
                        console.log(" Rezepte sind eingespeichert");
                        res.send(data);
                    } else {
                        data.push(item);
                        i++;
                        console.log(i);
                    }
                });
            });
        });
    });
});

// PUT (?)
// DELETE (?)

app.listen(8080);
console.log('Port: 8080');