
const path = require('path');
const fs = require('fs');
var rootPath = "";

function logdata(content) {
  try {
    const location = path.join(rootPath, 'SqaAgent.log');
    // Create appDataDir if not exist
    if (!fs.existsSync(rootPath)) {
      fs.mkdirSync(rootPath);
    }

    const appDataFilePath = path.join(rootPath, 'SqaAgent.log');
    content = JSON.stringify(content);

    fs.appendFile(appDataFilePath, "\n" + content, (err) => {
      if (err) {
        if(err.message.includes("EPERM: operation not permitted")){
        console.log("There was a problem saving data!");
        rootPath = path.join(process.env.APPDATA, '..', 'Local','SQA-Agent');
        logdata(content);

        }
        // console.log(err);
      } else {
        console.log("Data saved correctly!");
      }
    });
  } catch (err) {
    if(err.message.includes("EPERM: operation not permitted")){
      console.log("There was a problem saving data!");
      rootPath = path.join(process.env.APPDATA, '..', 'Local','SQA-Agent');
      logdata(content)
    }
    console.log(err);

  }
}

function resetFile() {

  const location = path.join(rootPath, 'SqaAgent.log');
  if (fs.existsSync(location)) {
    fs.unlinkSync(location);
  }
}

function setRootPath(PATH) {
  rootPath = PATH;
  rootPath="C:\\Program Files\\SQA-Agent";
}


module.exports = { logdata, setRootPath, resetFile }; 
