
const path = require('path');
const fs = require('fs');
var rootPath="";

function logdata(content) {
    const location = path.join(rootPath, 'SqaAgent.log');
    // Create appDataDir if not exist
    if (!fs.existsSync(rootPath)) {
      fs.mkdirSync(rootPath);
    }
  
    const appDataFilePath = path.join(rootPath, 'SqaAgent.log');
    content = JSON.stringify(content);
  
    fs.appendFile(appDataFilePath, "\n" + content, (err) => {
      if (err) {
        console.log("There was a problem saving data!");
        // console.log(err);
      } else {
        console.log("Data saved correctly!");
      }
    });
  }

  function resetFile(){
    const location = path.join(rootPath, 'SqaAgent.log');
    if (fs.existsSync(location)) {
      fs.unlinkSync(location);
    }
  }

  function setRootPath(PATH){
    rootPath=PATH;
  }


  module.exports = {logdata,setRootPath,resetFile}; 
