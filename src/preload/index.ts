import { contextBridge, ipcRenderer } from 'electron'

// Custom APIs for renderer
export const electron = {
  log: (callback) => ipcRenderer.on('log', (_event, message) => callback(_event, message)),
  store: {
    get(key) {
      return ipcRenderer.sendSync('get-store', key)
    },
    set(property, val) {
      ipcRenderer.send('set-store', property, val)
    },
    subscribe(key, func) {
      ipcRenderer.send('subscribe-store', key)
      const subscription = (_event, ...args) => func(...args)
      const channelName = `onChange:${key}`
      ipcRenderer.on(channelName, subscription)

      return () => {
        ipcRenderer.removeListener(channelName, subscription)
      }
    },
    unsubscribe(key) {
      ipcRenderer.send('unsubscribe-store', key)
    }
  },
  crop: {
    open: () => ipcRenderer.send('open-crop'),
    close: () => ipcRenderer.send('close-crop'),
    get: () => ipcRenderer.send('get-crop')
  },
  chat: {
    ocr: () => ipcRenderer.send('read-chat'),
    get: (callback) => ipcRenderer.on('get-chat', (_event, message) => callback(_event, message))
  },
  clipboard: {
    copy: (str) => ipcRenderer.send('clipboard-copy', str)
  }
}

contextBridge.exposeInMainWorld('electron', electron)
