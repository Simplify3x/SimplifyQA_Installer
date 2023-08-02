const { exec } = require('child_process');
const log =require('logger');
const fs = require('fs');
const http = require('https');
const axios = require('axios');
const path = require('path');
const https = require('http');
const { error } = require('console');
const { autoUpdater } = require("electron-updater");

const jsonSave=path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent', 'update.json');
const downloadPath=path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent');
const updateURL = "https://s3.ap-south-1.amazonaws.com/agent.simplifyqa.app/prod/windows";
const LocalPath = path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent');

//get patch file details
async function getPatchVersion(latestVersion,BrowserWindow,app,logger,Notification) {

var bsdiff=path.join(app.getAppPath(),'..', '..','libs','updatePatch');

//var bsdiff=path.join(app.getAppPath(),'libs','updatePatch');

logger.info("PATH : ",bsdiff);

var downloadSize=0;
var totalSize=0;
var percent=0;

const jsonurl=updateURL+"/"+latestVersion+"/update.json";

const jsonPath=path.join(updateURL,latestVersion,"update.json");

    try {

        const mainWindow = new BrowserWindow({
            width: 490,
            height: 190,
            resizable: true,
            frame: false,
            modal: true,
            focusable: true,
            alwaysOnTop: true,
            webPreferences: {
              nodeIntegration: true,
              contextIsolation: false
            },
          });
          //load progress bar html
          mainWindow.loadFile('progress-bar.html');

          const jsonFile=fs.createWriteStream(jsonSave);
          const jsonRequest=http.get(jsonurl,function (response){
            response.pipe(jsonFile);
            jsonFile.on("finish",()=>{
              jsonFile.close();
              logger.info("DOWNLOAD : Downoaded Json File Successfully at ",jsonSave);
              console.log("Downloaded Update Json file Successfully");
            });
            readTextFile(jsonSave)
            .then((jsondata)=>{
              try {
                const jsonData = JSON.parse(jsondata);
                logger.info("FILE : JSON : ",jsonData);
                const patches=jsonData.patches;
                logger.info("FILE : Patch Files : ",patches);
                const newFiles=jsonData.newFiles;
                logger.info("FILE : New Files : ",newFiles);
                totalSize=jsonData.totalSize;
                logger.info("FILE : Total Size : ",totalSize);

                //installerPath='D:\\Program File';
                installerPath=path.join(app.getAppPath(),'..', '..','..');
                logger.info("PATH : ",installerPath);

                patches.forEach(file => {
                  const folderPath= path.join(installerPath,file);
                  
                  var patchdownload=updateURL+"/"+latestVersion+"/patches/"+file+".bsdiff"; 
                  patchdownload=patchdownload.replaceAll("+","%2B");
  
                  const fileStream=fs.createWriteStream(path.join(downloadPath,file+".bsdiff"));
  
                   http.get(patchdownload, (response) =>{
                   if(response.statusCode!==200){
                    logger.info("DOWNLOAD : Unable to download the file ",file);
                    console.error("Unable to download the file");
                    return;
                   }
                   response.on('data',(data)=>{
                    fileStream.write(data);
                   });
                   response.on('end',()=>{
                    fileStream.end();
                    logger.info("DOWNLOAD : File downloaded successfully ",file);
                    console.log("File Downloaded Successfully");
    
                    const patchfilepath=path.join(downloadPath,file+".bsdiff");
                    const patchfolderPath=folderPath.replaceAll('+',path.sep);
                    getFileSize(patchdownload,logger).then((data)=>{
                      downloadSize= parseInt(downloadSize)+parseInt(data);
                      percent=(parseInt(downloadSize)/parseInt(totalSize))*100;
                      console.log('Percentage of  files downoaded : ' ,percent);
                      logger.info("PERCENTAGE : Percentage of files downloaded ",percent);
                      mainWindow.webContents.send('download-progress', percent);
                      if(percent===100){
                       // mainWindow.close();
                        //showNotification(Notification,logger);
                        functionNotification(Notification,logger,latestVersion,app,mainWindow);
                      }
                    });

                      if (fs.existsSync(patchfilepath)) {
                        runCommand(patchfolderPath, patchfilepath,bsdiff,logger); 
                     }else{
                      logger.info("ERROR : Patch file could not be located in the specified location ");
                      console.log('Path is not correctly defined ');
                     }
    
                   });
                   response.on('error',(err)=>{
                    logger.info("ERROR : Error while downloading the file ",err);
                    console.error("Error while  downloading",err);
                   });
                  }).on('error',(err)=>{
                    logger.info("ERROR : Error while making request ",err);
                    console.error('Error while making the request ',err);
                  });

                  // const writer = fs.createWriteStream(path.join(installerPath,file)); 
                  // response.data.pipe(writer);       
          });
                 
          newFiles.forEach(newFile=>{

            var newFileUrl=path.join(updateURL,latestVersion,"newFiles",newFile);
            newFileUrl=newFileUrl.replaceAll("+","%2B");

            const fileStream=fs.createWriteStream(path.join(downloadPath,newFile));

             http.get(newFileUrl, (response) =>{
             if(response.statusCode!==200){
              logger.info("DOWNLOAD : Unable to download new file ",newFile);
              console.error("Unable to download the file");
              return;
             }
             response.on('data',(data)=>{
              fileStream.write(data);
             });
             response.on('end',()=>{
              fileStream.end();
              logger.info("DOWNLOAD : Downloaded the new file successfully ",newFile)
              console.log("File Downloaded Successfully");

              getFileSize(newFileUrl,logger).then((data)=>{
                downloadSize= parseInt(downloadSize)+parseInt(data);
                percent=(parseInt(downloadSize)/parseInt(totalSize))*100;
                console.log('Percentage of  files downoaded : ' ,percent);
                logger.info("PERCENTAGE : Percentage of files downloaded ",percent);
                mainWindow.webContents.send('download-progress', percent);
                if(percent===100){
                 // mainWindow.close();
                  //showNotification(Notification,logger);
                  functionNotification(Notification,logger,latestVersion,app,mainWindow);
                }
              });

                  const part = newFile.split('+');
                  const actualName = part.pop();
                  console.log(actualName);
                  logger.info("FILE :  Name of the new file to be added ",actualName);
  
                  const parts = newFile.split('+');
                  const pathInAgent = parts.slice(0, -1).join('+');
                  logger.info("FILE : Path where it needs to be placed ",pathInAgent);
 
                  fs.copyFile(path.join(downloadPath,newFile), path.join(installerPath,pathInAgent.replaceAll('+',path.sep),actualName), (err) => {
                    if (err){
                      logger.info("FILE ERR : File was not copied to the destination ",pathInAgent.replaceAll('+',path.sep),actualName);
                      console.log('File was not copied to the destination ');
                    }else{
                      logger.info("FILE SUC : File was copied to the destination ",pathInAgent.replaceAll('+',path.sep),actualName);
                      console.log('File was copied to destination');
                    }
                  });
                fs.unlink(path.join(downloadPath,newFile),(err)=>{
                    if(err){
                      logger.info("DEL ERR : Error while deleting the file ",newFile," ERR ",err);
                      console.error("Error deleting the file : ",err);
                    }else{
                      logger.info("DELETE : Deleted the file successfully ",newFile);
                      console.log("File deleted successfully!");
                    }
                  });
             });
             response.on('error',(err)=>{
              logger.info("ERROR : Error while downloading the file ",err)
              console.error("Error while  downloading",err);
             });
            }).on('error',(err)=>{
              logger.info("ERROR : Error while making the request ",err);
              console.error('Error while making the request ',err);
            });
            
          });
                } catch (parseError) {
                  logger.info("ERROR : Error while Parsing the JSON file ",parseError);
                console.log('Error while parsing the file ',parseError);
              }
            })
            .catch((error) => {
              console.error('ERROR : Error while reading the JSON File ', error);
            });
          });
  
    } catch (err) {
      console.log(err);
      logger.info("ERROR : Error ",err);
    }  
  }

  async function readTextFile(filePath,logger) {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(filePath), 'utf8', (err, data) => {
        if (err) {
          logger.info("ERROR : Error while reading the file ",err);
          reject(err);
          return;
        }
         resolve(data);
      });
    });
  }
  
  async function runCommand(oldfile,patchFile,bsdiff,logger) {
  try {
    oldfile=oldfile.replaceAll("+",path.sep);
    const command=`bspatch "${oldfile}" "${oldfile}" "${patchFile}"`;
    logger.info("COMMAND : "+command);
      exec(command,{cwd:bsdiff} ,(error, stdout, stderr) => {
    if (error) {
      logger.info("ERROR : Error while applying patch : "+error.message)
      console.error(`Error executing command: ${error.message}`);
      return;
    }
    if (stderr) {
      logger.info("ERROR : Error while applying patch : "+stderr);
      console.error(`Command execution error: ${stderr}`);
      return;
    }
     console.log(`Command output:\n${stdout}`);
     logger.info("SUCCESS : Applied patch successfully ")
     fs.unlink(patchFile,(err)=>{
      if(err){
        logger.info("DEL ERR : Error while deletig the file ",patchFile ," ERR ",err);
        console.error("Error deleting the file : ",err);
      }else{
        logger.info("DELETE : Deleted the file successfully ",patchFile);
        console.log("File deleted successfully!");
      }
    });
  });
  } catch (error) {
    logger.info("ERROR : ",error);
    console.log(error);
  }
  }

  async function getFileSize(file,logger){
    const url=file;
    try {
      const response=await axios.head(url);
      const fileSize=response.headers['content-length'];
      console.log('File size : ',fileSize,"bytes");
      logger.info("FILE SIZE : Size of the file to be downloaded : ",fileSize);
      return fileSize;
    } catch (error) {
      console.log(error);
    }
  }

  async function functionNotification(Notification,logger,latestVersion,app,mainWindow){
    try {
      const version=path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent','version.json');
      readTextFile(version,logger).then((data)=>{
        const jsonData = JSON.parse(data);
        const currentVersion = jsonData.current_version;
        const previousVersions = jsonData.previous_versions;
        previousVersions.push(currentVersion);
        jsonData.current_version = latestVersion; 
        return  updateJsonFile(version,jsonData,logger,mainWindow);
      }).then((data)=>{
        if(data===latestVersion){
          logger.info("SUCCESS : Updated the Version.Json File Successfuly ",data);
        }else{
          logger.info("FAILURE : Failed to update the Json file ");
        }
        return showNotification(Notification,logger,mainWindow);
      }).catch((err)=>{
        logger.info("ERROR : Error while loading the notification ",err);
      }); 
      } catch (error) {
         logger.info("ERROR : Error while creating notification ",error);
      }
    }

async function updateJsonFile(version,jsonData,logger,mainWindow){
  return new Promise((resolve,reject)=>{
    try {
      fs.writeFile(version, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
        if (err) {
          logger.info("FAILURE : Updating the version in json file ",err)
          console.error('Error writing to the JSON file:', err);
          reject(err);
        } else {
          logger.info("SUCCESS : Version updated successfully ")
          console.log(`Update successful. Current version is now`);
          const data=jsonData.current_version;
          resolve(data);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

async function showNotification(Notification,logger,mainWindow){
  return new Promise((resolve,reject)=>{
    try {
      mainWindow.close();
      const NOTIFICATION_TITLE = 'SQA-Agent updated Successfully.'
      const NOTIFICATION_BODY = 'Ready to use the updated version.'
      new Notification({
        title: NOTIFICATION_TITLE,
        body: NOTIFICATION_BODY,
      }).show();
      logger.info("notification added successfully.");
      const data=1;
      resolve(data);
      setTimeout(() => {   
        autoUpdater.quitAndInstall(true, true); 
      }, 10000);
    } catch (error) {
      reject(error);
      logger.info("ERROR : Couldn't be able to load the notification title")
    }
  });
}
 async function getCurrentVersion(app,logger){
  return new Promise((resolve,reject)=>{
    const version=path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent','version.json')
  //const version=path.join(app.getAppPath(),'libs','version.json');
  readTextFile(version,logger).then((data)=>{
    const jsonData = JSON.parse(data);
    const currentVersion = jsonData.current_version; 
    resolve (currentVersion) ; 
    })
  })
}

async function createJsonFile(app,filepath,logger){
  if(!fs.existsSync(filepath)){
  const packageJsonPath = path.join(app.getAppPath(), 'package.json');
  const packageJsonData = require(packageJsonPath);
  version=packageJsonData.version;
  logger.info("VERSION : ",version);
  const jsonData={
    "previous_versions": [],
    "current_version":version
  };
  const jsonString = JSON.stringify(jsonData, null, 2);
  fs.writeFile(filepath, jsonString, 'utf-8', (err) => {
    if (err) {
      console.error('Error writing JSON file:', err);
    } else {
      console.log('JSON file has been created and written successfully.');
    }
  });
    }else{
console.log("File already Present");
    }
}


module.exports = {getPatchVersion,getCurrentVersion,createJsonFile};