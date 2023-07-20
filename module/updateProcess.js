const { exec } = require('child_process');
const log =require('logger');
const fs = require('fs');
const http = require('https');
const axios = require('axios');
const path = require('path');
const https = require('http');

const fileUrl = 'https://s3.ap-south-1.amazonaws.com/agent.simplifyqa.app/prod/windows/3.0.10/patch.txt';
const savePath = path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent', 'patch.txt');
const downloadPath=path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent');
const updateURL = "https://s3.ap-south-1.amazonaws.com/agent.simplifyqa.app/prod/windows";
const LocalPath = path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent');
const bsdiff='C:\\Users\\User\\Downloads\\bsdiff-v4.3-win-x64-vs2019';

var logger = log.createLogger('C:\\dist\\development.log');



//get patch file details
async function getPatchVersion(latestVersion) {

//const progressBar=document.getElementById('progress-bar');
var downloadSize=0;
var totalSize=await getFileSize('update.zip');

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
                    const downloadedSize=getSize(path.join(latestVersion,'patches',file+'.bsdiff'));
                    downloadSize+=downloadedSize;
                    fs.unlink(patchfilepath,(err)=>{
                      if(err){
                        console.error("Error deleting the file : ",err);
                      }else{
                        console.log("File deleted successfully!");
                      }
                      const uploadPercentage=(downloadSize/totalSize)*100;
                     // progressBar.style.width=uploadPercentage+'%';
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

  async function readTextFile(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(path.join(filePath), 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
         resolve(data);
      });
    });
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

  async function getFileSize(file){
    const url=path.join('https://s3.ap-south-1.amazonaws.com/agent.simplifyqa.app/prod/windows',file);
    try {
      const response=await axios.head(url);
      const fileSize=response.headers['content-length'];
      console.log('File size : ',fileSize," bytes");
      console.log(fileSize);
      return fileSize;
    } catch (error) {
      console.log(error);
    }
  }

  async function getSize(file){
        try {
            const size=await getFileSize(file);
            return size;
        } catch (error) {
            
        }
  }

  module.exports = {getPatchVersion};