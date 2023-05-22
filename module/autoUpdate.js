const {dialog} = require('electron');
const { autoUpdater } = require('electron-updater');
const ProgressBar = require('electron-progressbar');
const {logdata}=require("./logging.js");
const { rootPath } = require('electron-root-path');

autoUpdater.autoDownload = false;
const updateURL = "https://s3.ap-south-1.amazonaws.com/agent.simplifyqa.app/windows";

function agentupdate(app){

autoUpdater.setFeedURL({
    provider: 'generic',
    url: updateURL
});

autoUpdater.on('update-downloaded', function (event, releaseNotes, releaseName) {
    // Show a dialog box asking the user if they want to install the update
    dialog.showMessageBox({
        type: 'question',
        buttons: ['Install and Relaunch', 'Later'],
        defaultId: 0,
        message: `A new version of ${app.getName()} has been downloaded.`,
        detail: `It will be installed the next time you restart the application.`
    }, function (response) {
        if (response === 0) {
            // Quit and install the update
            autoUpdater.quitAndInstall();
            app.relaunch();
            app.quit();
        }
    });
});

// Listen for update error event
autoUpdater.on('error', function (error) {
    dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString());
});

// Listen for update checking event
autoUpdater.on('checking-for-update', function () {
    console.log('Checking for update...');
    logdata("checking update",rootPath);
});

// Listen for update available event
autoUpdater.on('update-available', function () {
    logdata("Update found",rootPath);
    const dialogOpts = {
        type: 'question',
        buttons: ['Yes', 'No'],
        defaultId: 0,
        message: 'A new update is available. Do you want to download it now?',
    };
    dialog.showMessageBox(dialogOpts).then((response) => {
        if (response.response === 0) {
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

        if (response.response === 1) {
            const dialogOpts = {
                type: 'question',
                buttons: ['Yes', 'No'],
                defaultId: 0,
                message: 'Do you want further notifications for this version',
            };
            dialog.showMessageBox(dialogOpts).then((response) => {
                if (response.response === 0) {

                }
                if (response.response === 1) {

                }

            });
        }
    });
});

// Listen for update not available event
autoUpdater.on('update-not-available', function () {
    logdata("Update not found",rootPath);
});

autoUpdater.on('download-progress', (progress) => {
    progressBar.value = progress.percent;
    progressBar.detail = `${Math.floor(progress.percent)}%`;
});

}

module.exports = {agentupdate}; 

