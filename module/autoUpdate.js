const { dialog, Menu, MenuItem } = require('electron');
const { autoUpdater } = require('electron-updater');
// const ProgressBar = require('electron-progressbar');
const { logdata } = require("./logging.js");
const { rootPath } = require('electron-root-path');
const { DataCopy } = require('./backup.js');
const { spawn } = require("child_process", 'spawn');
const { getPatchVersion }=require("./updateProcess.js");
const fs = require('fs');
const axios = require('axios');
const agentInstalledLocation = "";
const updateDownloadLocation = "";
const path = require('path');
const ProgressBar = require('progress');
const fileUrl = 'https://s3.ap-south-1.amazonaws.com/agent.simplifyqa.app/prod/windows/file.zip';
const savePath = path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent', 'update.zip');



autoUpdater.autoDownload = false;
const updateURL = "https://s3.ap-south-1.amazonaws.com/agent.simplifyqa.app/prod/windows";
const LocalPath = path.join(process.env.APPDATA, '..', 'Local', 'SQA-Agent');

function agentupdate(app, BrowserWindow) {

    autoUpdater.setFeedURL({
        provider: 'generic',
        url: updateURL
    });

    autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName) {


        //start the update-service (agent installed location, downloaded zip file path)
        // javaProcess = spawn('update-service.exe', [agentInstalledLocation,updateDownloadLocation]);


        //quit the application
        setTimeout(() => {
            app.quit();
        }, 15000);


        //app quit
        app.quit();

        // Show a dialog box asking the user if they want to install the update
        // dialog.showMessageBox({
        //     type: 'question',
        //     buttons: ['Install and Relaunch', 'Later'],
        //     defaultId: 0,
        //     message: `A new version of ${app.getName()} has been downloaded.`,
        //     detail: `It will be installed the next time you restart the application.`
        // }, function (response) {
        //     if (response === 0) {
        //         // Quit and install the update
        //         // autoUpdater.quitAndInstall(false);
        //         // app.relaunch();
        //         // app.quit();
        //         setImmediate(() => {
        //             logdata("inside setImmediate");
        //             app.removeAllListeners("window-all-closed")
        //             if (focusedWindow != null) {
        //               focusedWindow.close()
        //             }
        //             autoUpdater.quitAndInstall(true, true); 
        //         })
        //     }
        // });
    });

    // Listen for update error event
    autoUpdater.on('error', function (error) {
        dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString());
    });

    // Listen for update checking event
    autoUpdater.on('checking-for-update', function () {
        console.log('Checking for update...');
        logdata("checking update", rootPath);
    });

    // Listen for update available event
    autoUpdater.on('update-available', async (info) => {
        try {
            const currentVersion = info.versionInfo.version;
            const latestVersion = info.version;

            global.sharedThing.menu.append(new MenuItem({
                label: 'Updates Available',
                click: () => {
                    // //saving codeeditor folder in cache directory
                    // DataCopy(app);

                    // progressBar = new ProgressBar({
                    //     indeterminate: false,
                    //     title: 'Updating...',
                    //     text: 'Downloading update...',
                    //     detail: '0%',
                    //     browserWindow: {
                    //         webPreferences: {
                    //             nodeIntegration: true
                    //         }
                    //     }
                    // });
                    // autoUpdater.downloadUpdate();

                    //createWindow(BrowserWindow, latestVersion);

                    getPatchVersion(latestVersion).then((data)=>{
                        console.log(data);
                      });
                }
            }));
            logdata("Update found", rootPath);
            const dialogOpts = {
                type: 'question',
                buttons: ['Yes', 'No'],
                defaultId: 0,
                message: 'A new update is available. Do you want to download it now?',
            };

            dialog.showMessageBox(dialogOpts).then((response) => {
                if (response.response === 0) {
                    //saving codeeditor folder in cache directory
                    DataCopy(app);
                    progressBar = new ProgressBar({
                        indeterminate: false,
                        title: 'Updating...',
                        text: 'Downloading update...',
                        detail: '0%',
                        browserWindow: {
                            webPreferences: {
                                nodeIntegration: true
                            }
                        }
                    });
                    autoUpdater.downloadUpdate();

                }


            });
        } catch (err) {
            logdata(err);
        }
    });

    // Listen for update not available event
    autoUpdater.on('update-not-available', function () {
        logdata("Update not found", rootPath);
    });

    autoUpdater.on('download-progress', (progress) => {
        progressBar.value = progress.percent;
        progressBar.detail = `${Math.floor(progress.percent)}%`;
    });

}

function createWindow(BrowserWindow, latestVersion) {

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
    mainWindow.loadFile('progress-bar.html');
    const result = getPatchVersion1(latestVersion);

    result.forEach(file => {
        console.log(file);
    });


    // downloadFileWithProgressBar(fileUrl, savePath, mainWindow)
    //     .then(() => {
    //         console.log('File downloaded successfully.');
    //     })
    //     .catch((error) => {
    //         console.error('Error downloading the file:', error);
    //     });
}


async function getPatchVersion1(latestVersion) {

    const patchPath = path.join(updateURL, latestVersion, 'patch.txt');
    const localFilePath = path.join(LocalPath, 'patch.txt');
    const changedFiles = await axios({
        method: 'GET',
        patchPath,
        responseType: 'stream',
    });
    const writer = fs.createWriteStream(localFilePath);
    changedFiles.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });

    const FileArray = ((await readTextFile(localFilePath))).split(",");
    return FileArray;

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


async function downloadFileWithProgressBar(url, filePath, mainWindow) {
    try {
        const response = await axios({
            method: 'GET',
            url,
            responseType: 'stream',
        });



        const totalSize = parseInt(response.headers['content-length'], 10);
        let downloadedSize = 0;



        response.data.on('data', (chunk) => {
            downloadedSize += chunk.length;
            const progress = downloadedSize / totalSize;



            // Send progress value to the main window
            mainWindow.webContents.send('download-progress', progress);
        });



        const writer = fs.createWriteStream(filePath);



        response.data.pipe(writer);



        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error downloading the file:', error);
        throw error;
    }
}





module.exports = { agentupdate };

