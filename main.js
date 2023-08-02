//dependency files
const { checkConfigFile, VerifyConfigFilePresent, readExecutionUrl } = require("./module/config.js");
const { newConfigWindow, closeWindow, disconnectConnectJenkins } = require("./module/env_window.js");
const { contextMenu } = require("./module/menu.js");
// const { logdata, setRootPath, resetFile } = require("./module/logging.js");
const { agentupdate } = require("./module/autoUpdate.js");
const { browsersocket } = require("./scripts/BrowserActionSocket.js");
const { startAgent,killProcess } = require("./module/agentStart.js");
const { DataCopy, GetUpdatedData } = require("./module/backup.js");
const { getCurrentVersion,createJsonFile }=require("./module/updateProcess.js");


//application dependenciescheckConfigFile
const { app, Menu, Tray, ipcMain, protocol, dialog, BrowserWindow,Notification, MenuItem } = require('electron');
const fs = require('fs');
const https = require('http');
var kill = require('tree-kill');
const path = require('path');
const { spawn } = require("child_process", 'spawn');
const log =require('logger');




let startFlag = false;
let tray = null;
var javaProcess;
// const rootPath = require('electron-root-path').rootPath;
const rootPath = path.join(app.getAppPath(), '..', '..');
const windowsPath = path.join(rootPath, 'jre_1.8/bin/java');
const gotTheLock = app.requestSingleInstanceLock();
const applicationPath = path.join(app.getAppPath(), '..', '..');
var logger=log.createLogger(path.join(app.getAppPath(),'..', '..','update.log'));
var sqaAgent=log.createLogger(path.join(app.getAppPath(),'..', '..','SqaAgent.log'));
createJsonFile(app,path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent','version.json'),logger);


// var logger=log.createLogger(path.join(app.getAppPath(),'update.log'));
// var sqaAgent=log.createLogger(path.join(app.getAppPath(),'SqaAgent.log'));

// setRootPath(rootPath);
// resetFile();


console.log(path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent'));
//logdata("rootpath : " + rootPath);
sqaAgent.info("ROOTPATH : ",rootPath);

let version='';
getCurrentVersion(app,logger).then((data)=>{
version=data;
});


//hiding the popup box
ipcMain.handle('cancel', async (event, ...args) => {
  closeWindow();
});

//saving the file
ipcMain.handle('save', async (event, ...args) => {

  // check for VALID url
  if (args[0].startsWith("http://") || args[0].startsWith("https://")) {
    sqaAgent.info("URL : ",args[0]);
    console.log(args[0]);
    checkConfigFile(args,sqaAgent);
    closeWindow();
  }

  // if not show error message
  else {
    closeWindow();
    dialog.showErrorBox('Error ', 'Enter A valid URL');
    sqaAgent.info("ERROR : Enter a valid URL");
  }

})

//logdata("application started", rootPath);
sqaAgent.info("SUCCESS : Application Started ",rootPath);
const { autoUpdater } = require('electron-updater');
autoUpdater.autoDownload = false;



app.removeAsDefaultProtocolClient('sqa');

app.setAsDefaultProtocolClient('sqa', path.join(applicationPath, 'SQA-Agent.exe'));

//logdata("protocol added started", rootPath);
sqaAgent.info("Protocol added started ",rootPath);

//agent update check
agentupdate(app,BrowserWindow,logger,Notification);

function restartApp() {
  app.relaunch();
  app.quit();
}



function startNotification() {
  try {
    console.log("---------------START notification for tray--------------------")
    var a = https.get("http://localhost:4012/startnotification");
  }
  catch (err) {
    sqaAgent.error("ERROR : Error starting the Notification Tray ",err);
    sqaAgent.info("ERROR : Error starting the Notification Tray ",err);
    var b = err;
  }
}

app.on('open-url', (event, url) => {
  console.log("started");
});



if (!gotTheLock) {
  //logdata("app is quiting", rootPath);
  sqaAgent.info("APP : App is quitting ",rootPath);
  app.quit();
}
else {
  app.whenReady().then(async () => {
   // logdata("app is checking for updates", rootPath);
   sqaAgent.info("APP : App is checking for updates ",rootPath);
    global.sharedThing = {
      process: null,
      app: app,
      menu: null
    };
    //logdata("app has checked for updates", rootPath);
    sqaAgent.info("APP : App has checked for updates ",rootPath);
    let pid = await startAgent(rootPath,sqaAgent);
    // logdata("app is started", rootPath);
    // logdata("await added", rootPath);
    sqaAgent.info("APP : App is started ",rootPath);
    sqaAgent.info("APP : Await added ",rootPath);


    setTimeout(() => {
      startNotification();
    }, 5000);



    // logdata("tray : "+ rootPath + "/Contents/Resources/libs/images/loader_1.png")
    // tray = new Tray(path.join(rootPath, 'resources/libs/images/loader_2.png'))
    if (process.platform == 'darwin') {
      tray = new Tray(path.join(rootPath, '/Contents/Resources/libs/images/loader_2.png'))
    } else if (process.platform == 'win32') {
      //logdata(path.join(rootPath, '/resources/libs/images/simplifylogo.ico'), rootPath);
      sqaAgent.info("PATH : ",path.join(rootPath, '/resources/libs/images/simplifylogo.ico'),rootPath);
      // tray = new Tray(path.join(rootPath, '/resources/libs/images/qa.png'))
      tray = new Tray(__dirname + '\\resources\\' + 'qa.png');
      //logdata("Tray :" + tray, rootPath)
      sqaAgent.info("TRAY : ",tray , rootPath);
    }



    console.log("ROOT PATH :" + rootPath)
    tray.setToolTip('Simplify3x')
    tray.setContextMenu(contextMenu(app, rootPath,BrowserWindow,logger,sqaAgent,version))
    tray.focus();
    startFlag = true;
    autoUpdater.checkForUpdatesAndNotify();

    // logdata("Before readExecutionUrl");
    // readExecutionUrl(app);
    // logdata("After readExecutionUrl");
    GetUpdatedData(app,sqaAgent);
    //logdata("GetUpdatedData method done");
    sqaAgent.info("Get Updated Data method done");
    disconnectConnectJenkins(sqaAgent);
    // killProcess();

    try {
      tray.displayBalloon();
    }
    catch { }
  }
  );
}

