const {contextBridge, ipcRenderer} = require('electron');

contextBridge.exposeInMainWorld('receiptPdf', {
  saveOne: (payload) => ipcRenderer.invoke('receipt-pdf:save-one', payload),
  saveMany: (payload) => ipcRenderer.invoke('receipt-pdf:save-many', payload),
});
