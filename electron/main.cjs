const {app, BrowserWindow, Menu, shell, ipcMain, dialog} = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const {createReceiptPdf} = require('./receiptPdf.cjs');

const APP_ID = 'kr.co.ubion.order-cost-manager';

app.setAppUserModelId(APP_ID);

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    backgroundColor: '#f8fafc',
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  window.once('ready-to-show', () => {
    window.show();
  });

  window.webContents.setWindowOpenHandler(({url}) => {
    if (url.startsWith('https://') || url.startsWith('http://')) {
      void shell.openExternal(url);
    }

    return {action: 'deny'};
  });

  void window.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
}

function safePdfFileName(fileName) {
  const clean = String(fileName || '수납확인서.pdf')
    .replace(/[\\/:*?"<>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean.toLowerCase().endsWith('.pdf') ? clean : `${clean}.pdf`;
}

ipcMain.handle('receipt-pdf:save-one', async (event, payload) => {
  const owner = BrowserWindow.fromWebContents(event.sender);
  const fileName = safePdfFileName(payload?.fileName);
  const options = {
    title: '수납확인서 PDF 저장',
    defaultPath: fileName,
    filters: [{name: 'PDF 문서', extensions: ['pdf']}],
  };
  const result = owner ? await dialog.showSaveDialog(owner, options) : await dialog.showSaveDialog(options);

  if (result.canceled || !result.filePath) return {saved: false};
  const pdf = await createReceiptPdf(payload?.html);
  await fs.writeFile(result.filePath, pdf);
  return {saved: true, filePath: result.filePath};
});

ipcMain.handle('receipt-pdf:save-many', async (event, payload) => {
  const documents = Array.isArray(payload?.documents) ? payload.documents.slice(0, 500) : [];
  if (documents.length === 0) return {saved: false};

  const owner = BrowserWindow.fromWebContents(event.sender);
  const options = {
    title: '수납확인서 PDF 저장 폴더 선택',
    properties: ['openDirectory', 'createDirectory'],
  };
  const result = owner ? await dialog.showOpenDialog(owner, options) : await dialog.showOpenDialog(options);

  if (result.canceled || !result.filePaths[0]) return {saved: false};
  const directory = result.filePaths[0];
  const usedNames = new Map();

  for (const document of documents) {
    const original = safePdfFileName(document?.fileName);
    const count = usedNames.get(original) || 0;
    usedNames.set(original, count + 1);
    const fileName = count === 0 ? original : original.replace(/\.pdf$/i, ` (${count + 1}).pdf`);
    const pdf = await createReceiptPdf(document?.html);
    await fs.writeFile(path.join(directory, fileName), pdf);
  }

  return {saved: true, directory, count: documents.length};
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
