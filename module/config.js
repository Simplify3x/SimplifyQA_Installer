const fs = require('fs');
const path = require('path');

const { newConfigWindow,closeWindow }=require("./env_window.js");
const configFilePath = path.join(process.env.APPDATA, "config.properties");
var PropertiesReader = require('properties-reader');
const URL = "https://simplifyqa.app";
// const URL="https://demo.simplifyqa.app";
// const URL="";


function checkConfigFile(args){
    if (fs.existsSync(configFilePath)) {
        console.log("file present");
        var properties = PropertiesReader(configFilePath);
        properties.set("url", args[0]);
        properties.save(configFilePath, function then(err, data) {
          if (err) {
              console.log("error in write a properties file")
          }
          console.log("saved data to properties file")
      });
      }else{
        fs.closeSync(fs.openSync(configFilePath, 'w'));
        var properties = PropertiesReader(configFilePath);
        properties.set("url", args[0]);
        properties.save(configFilePath, function then(err, data) {
          if (err) {
              console.log("error in write a properties file")
          }
          console.log("saved data to properties file")
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

module.exports = { checkConfigFile,VerifyConfigFilePresent } 
