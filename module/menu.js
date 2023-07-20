const { Menu, MenuItem } = require('electron');
const path = require('path');
const https = require('http');
const { newConfigWindow, closeWindow } = require("./env_window.js");
var kill = require('tree-kill');
const { startAgent, killProcess } = require("./agentStart.js");
const { logdata, setRootPath, resetFile } = require("./logging.js");
const fs = require('fs');
const http = require('https');
const axios = require('axios');
const ProgressBar = require('progress');
const { exec } = require('child_process');
const log =require('logger');
const {getPatchVersion}=require("./updateProcess.js")

const { spawn } = require("child_process", 'spawn');
const fileUrl = 'https://s3.ap-south-1.amazonaws.com/agent.simplifyqa.app/prod/windows/3.0.10/patch.txt';
const savePath = path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent', 'patch.txt');
const downloadPath=path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent');

const updateURL = "https://s3.ap-south-1.amazonaws.com/agent.simplifyqa.app/prod/windows";
const LocalPath = path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent');
const bsdiff='C:\\Users\\User\\Downloads\\bsdiff-v4.3-win-x64-vs2019';

var logger = log.createLogger('C:\\dist\\development.log');

var sizeOfUpdate=0;

module.exports={
  sizeOfUpdate:sizeOfUpdate
};

function contextMenu(app, path, BrowserWindow) {
  const context_menu = Menu.buildFromTemplate([
    {
      label: 'Version : 3.0.8', type: 'normal', click: () => {
      }
    }, {
      label: 'Release Notes', type: 'normal', click: () => {
        shell.openExternal('https://simplifyqa.app');
      }
    },
    {
      label: 'Restart', type: 'normal', click: () => {
        kill(global.sharedThing.process);
        resetFile();
        killProcess();
        setTimeout(() => {
          startAgent(path);
        }, 1000);
        setTimeout(() => {
          console.log("---------------start RESTART notification for tray--------------------")
          https.get("http://localhost:4012/restartnotification");
        }, 12000);
      }
    },
    {
      label: 'Quit', type: 'normal', click: () => {
        killProcess();
        console.log("---------------start STOP notification for tray--------------------")
        https.get("http://localhost:4012/stopnotification");
        // setTimeout(() => {
        //   process.kill(pid);
        // }, 3000);
        app.isQuiting = true;
        process.kill(global.sharedThing.process);
        app.quit();


      }
    }, {

      label: 'Change Environment', type: 'normal', click: () => {
        newConfigWindow(app);
      }

    }, {
      label: 'start update-service', type: 'normal', click: () => {
        // createWindow(BrowserWindow);
        // getPatchVersion('3.0.10').then((data)=>{
        //   console.log(data);
        // });

        //const size= getFileSize('update.zip');
        getPatchVersion('3.0.10');

      }
    }
  ]);


  global.sharedThing.menu = context_menu;
  return context_menu;
}


function createWindow(BrowserWindow, latestVersion) {

  try {
    //update window
    const mainWindow = new BrowserWindow({
      width: 410,
      height: 180,
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
    // mainWindow.loadFile('progress-bar.html');
    // getPatchVersion('3.0.10')
    // .then(() => {
    //     console.log('File downloaded successfully.');
    // })
    // .catch((error) => {
    //     console.error('Error downloading the file:', error);
    // });

    // console.log(result);


    downloadFileWithProgressBar(fileUrl, savePath, mainWindow)
      .then((data) => {
        console.log('File downloaded successfully.');
        console.log(data);
      })
      .catch((error) => {
        console.error('Error downloading the file:', error);
      });




  } catch (err) {
    console.log(err);
  }

}


async function readTextFile(filePath) {

  return new Promise((resolve, reject) => {

    fs.readFile(path.join(filePath), 'utf8', (err, data) => {

      if (err) {

        reject(err);

        return;

      }

      // const FileArray = ((readTextFile(filePath))).split(",");

      resolve(data);

    });

  });

}



async function downloadFileWithProgressBar(url, filePath, mainWindow) {
  try {
    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
    });



    // const totalSize = parseInt(response.headers['content-length'], 10);
    // let downloadedSize = 0;



    // response.data.on('data', (chunk) => {
    //   downloadedSize += chunk.length;
    //   const progress = downloadedSize / totalSize;



    //   // Send progress value to the main window
    //   mainWindow.webContents.send('download-progress', progress);
    // });



    const writer = fs.createWriteStream(filePath);



    response.data.pipe(writer);

    // const FileArray = ((readTextFile(filePath))).split(",");


    return new Promise(async (resolve, reject) => {

      // const FileArray= await readTextFile();
      writer.on('finish', resolve());
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading the file:', error);
    throw error;
  }
}



//get patch file details
async function getPatchVersion1(latestVersion) {
  const patchPath = updateURL + "/" + latestVersion + "/patch.txt";
  console.log(patchPath);

  try {

    const file = fs.createWriteStream(savePath);
    const request = http.get(fileUrl, function (response) {
      response.pipe(file);
      // after download completed close filestream
      file.on("finish", () => {
        file.close();
        console.log("Download Completed");

         readTextFile(savePath)
          .then((data) => {
            //list of patch files
            const fileList=data.split(",");


            installerPath="C:\\simplify3x";
            //

            //download patch file
            fileList.forEach(file => {
              const folderPath= path.join(installerPath,file);
             

              // logger.info("Folder where the patch file needs to applied : "+folderPath.replaceAll('+',path.sep));

              //var patchfiledownload= updateURL+"/"+latestVersion+"/patches/"+file+".bsdiff";  
              //patchfilepath=patchfilepath.replaceAll("+","%2B"); 
              // const response =  axios({
              //   method: 'GET',
              //   patchfilepath,
              //   responseType: 'stream',
              // });


              var patchdownload=updateURL+"/"+latestVersion+"/patches/"+file+".bsdiff"; 
              patchdownload=patchdownload.replaceAll("+","%2B");

              const fileStream=fs.createWriteStream(path.join(downloadPath,file+".bsdiff"))
               http.get(patchdownload, (response) =>{
               if(response.statusCode!==200){
                console.error("Unable to download the file");
                return;
               }
               response.on('data',(data)=>{
                fileStream.write(data);
               });
               response.on('end',()=>{
                fileStream.end();
                console.log("File Downloaded Successfully");

                const patchfilepath=path.join(downloadPath,file+".bsdiff");
                const patchfolderPath=folderPath.replaceAll('+',path.sep);

                if (fs.existsSync(patchfilepath)) {
                  runCommand(patchfolderPath, patchfilepath,logger);
                  fs.unlink(patchfilepath,(err)=>{
                    if(err){
                      console.error("Error deleting the file : ",err);
                    }else{
                      console.log("File deleted successfully!");
                    }
                  })
                }

               });
               response.on('error',(err)=>{
                console.error("Error while  downloading",err);
               });
              }).on('error',(err)=>{
                console.error('Error while making the request ',err);
              });


                
                

              // const writer = fs.createWriteStream(path.join(installerPath,file));

              // response.data.pipe(writer);


              
      });
          })
          .catch((error) => {
            console.error('Error downloading the file:', error);
          });

      });
    });

  } catch (err) {
    console.log(err);
    throw err;
  }


}

async function runCommand(oldfile,patchFile,logger) {
try {
  oldfile=oldfile.replaceAll("+",path.sep);
  const command=`bspatch "${oldfile}" "${oldfile}" "${patchFile}"`;
  logger.info("BSPatch command : "+command);
    exec(command,{cwd:bsdiff} ,(error, stdout, stderr) => {
  if (error) {
    logger.info("Error : "+error.message)
    console.error(`Error executing command: ${error.message}`);
    return;
  }
  if (stderr) {
    logger.info("Error : "+stderr)
    console.error(`Command execution error: ${stderr}`);
    return;
  }
  console.log(`Command output:\n${stdout}`);
});
} catch (error) {
  console.log(error);
}
}

module.exports = { contextMenu }; 
