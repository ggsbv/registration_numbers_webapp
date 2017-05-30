"use strict";

//require necessary packages
const express = require("express");
const expressHandlebars = require("express-handlebars");
const serve = require("express-static");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const format = require("util").format;

//require local functions
const addToList = require("./addToList");
const filterList = require("./filterList");

//initialise expressJS server
var app = express();

//connect to MongoDB
mongoose.connect(process.env.MONGO_DB_URL || "mongodb://localhost/registration_numbers");
var SavedRegNumbers = mongoose.model("SavedRegNumbers", {regNum: String, counter: Number});

//configure port env
app.set("port", (process.env.PORT || 3001));

//configure template engine
app.engine("handlebars", expressHandlebars({defaultLayout : "main"}));
app.set("view engine", "handlebars");

//configure middleware
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(serve("public"));

//Initialise session history array, which will contain all registration numbers
//which have been entered this session.
var sessionHistory = {};

//home page
app.get("/", function(req, res){
  res.render("home");
});

//form submission root
app.post("/regNumInput", function(req, res){
  var regNumInput = req.body.regNumInput;
  var radioSelected = req.body.locationRadioButton;
  var submitButton = req.body.regNumSubmit;
  var filterButton = req.body.filterSubmit;
  var errorMsg = "";
  var data = "";
  var regNumsToDisplay = [];
  //if input isn't blank
  if(submitButton){
    if(regNumInput !== ""){
      regNumInput = regNumInput.toUpperCase();
      //addToList function will add regNumInput to session history if it does
      //not exist yet, or will increment the counter if it already exists
      addToList(regNumInput, sessionHistory);

      //add the registration number to our MongoDB
      SavedRegNumbers.findOne({regNum: regNumInput}, function(err, result){
        if(err){
          console.log("Error occured while trying to findOne " + regNumInput);
        } else {
          //if inputRegNum doesn't exist in DB, create new entry for collection
          if(!result){
            var newRegNum = new SavedRegNumbers({regNum: regNumInput, counter: 1});
            newRegNum.save(function(err){
              if(err){
                console.log("Error while saving regNum to DB.");
              } else {
                console.log("RegNum successfully saved to the collection.");
              };
            });
          } else {
          //otherwise increment the counter of entry corresponding to the inputRegNum
          //in the DB.
            SavedRegNumbers.update(
              {regNum: regNumInput},
              {
                $inc: {counter: 1},
              },
              function(err, results){
                if(err){
                  console.log("Error while incrementing " + inputRegNum + " counter in the DB.");
                } else {
                  console.log(regNumInput + " successfully incremented in the DB.");
                };
              }
            );
          };
        };
      });
    } else {
      errorMsg = "Please enter a valid registration number.";
    };

    //create a new array containing all keys (regNumbers) in the session
    //history, which will be displayed
    for(var currentRegNum in sessionHistory){
      regNumsToDisplay.push(currentRegNum);
    };
    //if there an error msg
    if(errorMsg !== ""){
      //the data that will be rendered will include that error message
      data = {error : errorMsg, regNumList : regNumsToDisplay}
    } else {
      //otherwise just display the session's reg numbers
      data = {regNumList : regNumsToDisplay};
    };
  } else if (filterButton){
    if(radioSelected === undefined){
      radioSelected = 'ALL';
    }
    console.log(radioSelected);
    //filterList function will filter and return a list containing all
    //registration numbers which satisfy the condition of the radio button
    //that was chosen
    var filteredList = filterList(sessionHistory, radioSelected);
    data = {regNumList: filteredList};
  };
  res.render("home", data);
});

app.get("/history", function(req, res){
  var data = "";
  SavedRegNumbers.distinct("regNum", function(err, regNums){
    console.log(regNums);
    if(err){
      console.log("Error while creating regNum list for the history page.");
    } else {
      data = {regNum: regNums};
    };
    res.render("history", data);
  });
});

app.get("/history/:regNum", function(req, res){
  var inputRegNum = req.params.regNum;

  var data = "";
  var timesGreeted = "";
  SavedRegNumbers.find(function(err, results){
    for(var i = 0; i < results.length; i++){
      var currentObj = results[i];
      if(currentObj.regNum === inputRegNum){
        timesGreeted = currentObj.counter
      };
    };
    data = {regNum : inputRegNum, times: timesGreeted};
    res.render("counter", data);
  });
});
//set app to listen
app.listen(app.get("port"), function(){
  console.log("The frontend server is running on port 3001!");
});
