const path = require('path');
const fs = require('fs-extra');
// const { logdata } = require("./logging.js");
const destDir = path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent', 'Updates', 'codeEditorProjects');

function DataCopy(app) {
  const source = path.join(app.getAppPath(), '..', '..', 'codeEditorProjects');

  try {
    // logdata("destination : " + destDir);
    // logdata("source : " + source);
    fs.copySync(source, destDir, { overwrite: true | false })
    console.log('success!')
  } catch (err) {
    console.error(err)
  }
}



function GetUpdatedData(app,sqaAgent) {

  //logdata("GetUpdatedData method reached.");
  sqaAgent.info("BACKUP : Get Updated Data method reached")

  const destDir = path.join(app.getAppPath(), '..', '..', 'codeEditorProjects');
  const source = path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent', 'Updates', 'codeEditorProjects');
  try {

    // logdata("destination : "+destDir);
    // logdata("source : "+ source);
    sqaAgent.info("BACKUP : Destination - ",destDir);
    sqaAgent.info("BACKUP : Source - ",source);

    if (fs.existsSync(source)) {
      fs.copySync(source, destDir, { overwrite: true | false })
      //logdata("successfully copied codeeditor folder.");
      sqaAgent.info("BACKUP : Successfully copied code_editor folder");
      fs.removeSync(source);
    } else {
      sqaAgent.info("BACKUP : AppData codeeditor projects file not present");
    //  logdata("AppData codeeditor projects file not present.");

    }

  } catch (err) {
    console.error(err);
    sqaAgent.info("BACKUP ERROR : ",err);
    sqaAgent.error("BACKUP : ",err);
  }
}

module.exports = { DataCopy, GetUpdatedData }; 
