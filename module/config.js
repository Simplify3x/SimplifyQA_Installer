const fs = require('fs');
const path = require('path');

const { newConfigWindow,closeWindow }=require("./env_window.js");
const configFilePath = path.join(process.env.APPDATA, "config.properties");
var PropertiesReader = require('properties-reader');
var URL;


function checkConfigFile(args,sqaAgent){
    if (fs.existsSync(configFilePath)) {
        console.log("file present");
        sqaAgent.info("CONFIG : Config file present");
        var properties = PropertiesReader(configFilePath);
        properties.set("url", args[0]);
        properties.save(configFilePath, function then(err, data) {
          if (err) {
            sqaAgent.info("CONFIG : Error while writing properties file ",err);
              console.log("error in write a properties file")
          }
          sqaAgent.info("CONFIG : Saved data to properties file");
          console.log("saved data to properties file")
      });
      }else{
        fs.closeSync(fs.openSync(configFilePath, 'w'));
        var properties = PropertiesReader(configFilePath);
        properties.set("url", args[0]);
        properties.save(configFilePath, function then(err, data) {
          if (err) {
              sqaAgent.info("CONFIG : Error while writing properties file ",err);
              console.log("error in write a properties file")
          }
          sqaAgent.info("CONFIG : Saved data to properties file");
          console.log("saved data to properties file");
      });
      }
}

function VerifyConfigFilePresent(app) {

    if (fs.existsSync(configFilePath)) {
      console.log("file present");
    } else {
      console.log("file not present");
      newConfigWindow(app);  
  
    }
  }


  function readExecutionUrl(app){

    var properties=PropertiesReader("./config.properties");
    URL=properties.get("url");


    if(URL==""){
        if(fs.existsSync(configFilePath)){
          console.log("file present");
        }else{
          console.log("file not present");
          fs.closeSync(fs.openSync(configFilePath, 'w'));
          var properties = PropertiesReader(configFilePath);
          properties.set("url","");
          properties.save(configFilePath, function then(err, data) {
            if (err) {
                console.log("error in write a properties file")
            }
            console.log("saved data to properties file")
        });
          newConfigWindow(app);
        }
    }

    else{
      checkConfigFile([URL]);
    }

    VerifyConfigFilePresent(app);
  }

module.exports = { checkConfigFile,VerifyConfigFilePresent,readExecutionUrl } 
