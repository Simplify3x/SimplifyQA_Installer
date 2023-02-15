'use strict';
const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');
exports.default = context => {
  const lprojRegEx = /(en)\.lproj/g;
  const APP_NAME = context.packager.appInfo.productFilename;
  const APP_OUT_DIR = context.appOutDir;
  const PLATFORM = context.packager.platform.name;
  const cwd = path.join(`${APP_OUT_DIR}`, `${APP_NAME}.app/Contents/Resources`);
  const lproj = glob.sync('*.lproj', { cwd });
  const _promises = [];
  switch (PLATFORM) {
    case 'mac':
      lproj.forEach(dir => {
        if (!lprojRegEx.test(dir)) {
          _promises.push(fs.remove(path.join(cwd, dir)));
        }
      });
      break;

    case 'win':
      var source = './resources/libs'
      var destination = './libs'
      fs.copy(source, destination, function (err) {
        if (err){
            console.log('An error occured while copying the folder.')
            return console.error(err)
        }
        console.log('Copy completed!')
    });
     
    default:
      break;
  }
  return Promise.all(_promises);
};
