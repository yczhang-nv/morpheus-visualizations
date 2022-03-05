import { app, BrowserWindow } from 'electron';
// This allows TypeScript to pick up the magic constant that's auto-generated by Forge's Webpack
// plugin that tells the Electron app where to look for the Webpack-bundled app code (depending on
// whether you're running in development or production).
declare const MAIN_WINDOW_WEBPACK_ENTRY: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = (): void => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    height: 768,
    width: 1280,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    }
  });

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  // Open the DevTools.
  if (!!process.env.DEBUG) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.once('dom-ready', () => onDOMReady(mainWindow));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

import { setDefaultAllocator } from '@rapidsai/cuda';
import {
  DeviceBuffer,
  PoolMemoryResource,
  getCurrentDeviceResource,
  setCurrentDeviceResource,
} from '@rapidsai/rmm';

(() => {
  const mr = new PoolMemoryResource(
    getCurrentDeviceResource(),
    2 * (1024 ** 3), // 2GiB
    4 * (1024 ** 3), // 4GiB
  );
  setCurrentDeviceResource(mr);
  setDefaultAllocator((byteLength) => new DeviceBuffer(byteLength, mr));
})();

import { Series } from '@rapidsai/cudf';
Series.new([0, 1, 2]).sum();

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
import { ipcMain } from 'electron';
import { shape } from './main/etl/shape';
import { layout } from './main/etl/layout';
import { testDataSource } from './main/etl/test-source';

function onDOMReady(mainWindow: BrowserWindow) {
  console.log('webContents dom-ready');
  (async () => {
    for await (const x of layout(shape(testDataSource()))) {
      const done = new Promise((r) => ipcMain.once('renderComplete', r));
      mainWindow.webContents.send('render', x);
      await done;
    }
  })().then(() => { }, (e) => { console.error(e); throw e; });
}
