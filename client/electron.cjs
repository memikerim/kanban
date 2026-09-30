/* eslint-disable */
const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, 
      backgroundThrottling: false 
    },
  });

  // SORUNLU PAKET YERİNE ELECTRON'UN KENDİ ÖZELLİĞİNİ KULLANIYORUZ
  const isDev = !app.isPackaged;

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:5173'
      : `file://${path.join(__dirname, 'dist/index.html')}`
  );

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus(); 
  });

  mainWindow.on('focus', () => {
    if (mainWindow.webContents) {
      mainWindow.webContents.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});