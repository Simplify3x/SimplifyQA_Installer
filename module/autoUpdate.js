const { dialog, Menu, MenuItem, BrowserWindow } = require("electron");
const { autoUpdater } = require("electron-updater");
// const ProgressBar = require('electron-progressbar');
//const { logdata } = require("./logging.js");
const { rootPath } = require("electron-root-path");
const { DataCopy } = require("./backup.js");
const { spawn } = require("child_process", "spawn");
const { getPatchVersion } = require("./updateProcess.js");
const fs = require("fs");
const axios = require("axios");
const agentInstalledLocation = "";
const updateDownloadLocation = "";
const path = require("path");
const ProgressBar = require("progress");

autoUpdater.autoDownload = false;
const updateURL =
  "https://s3.ap-south-1.amazonaws.com/agent.simplifyqa.app/prod/windows";
const LocalPath = path.join(process.env.APPDATA, "..", "Local", "SQA-Agent");


function agentupdate(app, BrowserWindow,logger,Notification) {
  autoUpdater.setFeedURL({
    provider: "generic",
    url: updateURL,
  });

  autoUpdater.on(
    "update-downloaded",
    function (event, releaseNotes, releaseName) {
      //quit the application
      setTimeout(() => {
        app.quit();
      }, 15000);
      //app quit
      app.quit();
    }
  );

  // Listen for update error event
  autoUpdater.on("error", function (error) {
    dialog.showErrorBox(
      "Error: ",
      error == null ? "unknown" : (error.stack || error).toString()
    );
  });

  // Listen for update checking event
  autoUpdater.on("checking-for-update", function () {
    console.log("Checking for update...");
    logger.info("UPDATE : Checking for updates ",rootPath);
    
  });

  // Listen for update available event
  autoUpdater.on("update-available", async (info) => {
    try {
      
        logger.info("info update data : "+info.version);
        const latestVersion = info.version;

        //------------My Code-----------
        readJson(app).then((currentVersion)=>{
        logger.info("VERSION CHECK-- : ",currentVersion);
        return compareVersions(latestVersion,currentVersion,logger); 
        }).then((data)=>{   
          logger.info("DATA : ",data);
        if(data===1){
      //----------Previous Code---------------

        global.sharedThing.menu.append(
        new MenuItem({
          label: "Updates Available",
          click: () => {
            getPatchVersion(latestVersion, BrowserWindow,app,logger,Notification);
          },
        })
      );
      logger.info("Update found ",rootPath);
    //  logdata("Update found", rootPath);
      const dialogOpts = {
        type: "question",
        buttons: ["Yes", "No"],
        defaultId: 0,
        message: "A new update is available. Do you want to download it now?",
      };

      dialog.showMessageBox(dialogOpts).then((response) => {
        if (response.response === 0) {
          getPatchVersion(latestVersion,BrowserWindow,app,logger,Notification);
        }
      });

      //---------------Previous Code End -------------------- 
    }
      }).catch((err)=>{
        logger.error(err);
      });
    //---------My Code End-----------

    } catch (err) {
        logger.info("Exception while update : "+err);
    }
  });

  // Listen for update not available event
  autoUpdater.on("update-not-available", function () {
    logger.info("AUTOUPDATE : Update not found ",rootPath);
    //logdata("Update not found", rootPath);
  });

  autoUpdater.on("download-progress", (progress) => {
    progressBar.value = progress.percent;
    progressBar.detail = `${Math.floor(progress.percent)}%`;
  });
}

async function readJson(app,logger){
  return new Promise((resolve,reject)=>{
    //const version =path.join(app.getAppPath(),'..','..','libs','version.json');
    const version=path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent','version.json');
    fs.readFile(version, 'utf8', (err, data) => {
      if (err) {
       logger.info("Error Reading the versions")
        reject(err);
      }
      const jsonData = JSON.parse(data);
      const currentVersion = jsonData.current_version;
      resolve(currentVersion);
    });
  
  });
}

async function compareVersions(version1,version2,logger){
  return new Promise((resolve,reject)=>{
   try {
    const arr1 = version1.split('.').map(Number);
    const arr2 = version2.split('.').map(Number);
    for (let i = 0; i < Math.max(arr1.length, arr2.length); i++) {
      const num1 = arr1[i] || 0;
      const num2 = arr2[i] || 0;
      if (num1 < num2) {
        const data=-1;
        resolve(data);
      } else if (num1 > num2) {
        const data=1;
        resolve(data);
      }
    }
    const data=0;
    resolve (data);
   } catch (error) {
    reject(error);
    logger.info(version1,version2);
    logger.info("ERROR : Error while comparing the versions ",error);
   }
  });
  }

module.exports = { agentupdate };
