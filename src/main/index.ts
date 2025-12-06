import { app, shell, BrowserWindow, ipcMain, Rectangle, clipboard } from 'electron'
import { join } from 'node:path'
import { unlink } from 'node:fs'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import Store from 'electron-store'
import { getWWM, relativePosition, screenshot, ocr } from './chatScanner'
import Ocr from '@gutenye/ocr-node'

let paddleOCR
if (app.isPackaged) {
  const unpacked = join(
    process.resourcesPath,
    'app.asar.unpacked/node_modules/@gutenye/ocr-models/assets'
  )
  paddleOCR = await Ocr.create({
    models: {
      detectionPath: join(unpacked, 'ch_PP-OCRv4_det_infer.onnx'),
      recognitionPath: join(unpacked, 'ch_PP-OCRv4_rec_infer.onnx'),
      dictionaryPath: join(unpacked, 'ppocr_keys_v1.txt')
    }
  })
} else {
  paddleOCR = await Ocr.create()
}

const store = new Store()
const subscriptions = new Map()
const dataPath = app.getPath('userData')

ipcMain.on('clipboard-copy', async (_event, val) => {
  try {
    clipboard.writeText(val)
  } catch {
    logger('clipboardError')
  }
})

const logger = (msg: string): void => {
  mainWindow.webContents.send('log', msg)
}

// yeah I know I didnt sanitize this but whatever
const cropWindow = (): Rectangle =>
  (store.get('cropWindow') as Rectangle) ??
  ({ x: 100, y: 100, height: 200, width: 200 } as Rectangle)

const cropArea = (): Rectangle =>
  (store.get('cropArea') as Rectangle) ?? ({ x: 100, y: 100, height: 200, width: 200 } as Rectangle)

const sendToAll = (channel, msg): void => {
  BrowserWindow.getAllWindows().forEach((browseWindow) => {
    browseWindow.webContents.send(channel, msg)
  })
}

ipcMain.on('get-store', async (event, val) => {
  event.returnValue = store.get(val)
})
ipcMain.on('set-store', async (_, key, val) => {
  store.set(key, val)
})

ipcMain.on('subscribe-store', async (_event, key) => {
  const unsubscribeFn = store.onDidChange(key, (newValue) => {
    sendToAll(`onChange:${key}`, newValue)
  })
  subscriptions.set(key, unsubscribeFn)
})

ipcMain.on('unsubscribe-store', async (_event, key) => {
  subscriptions.get(key)()
})

let childWindow: BrowserWindow
let mainWindow: BrowserWindow

function createCropWindow(cropWindow_: Rectangle): void {
  childWindow = new BrowserWindow({
    parent: mainWindow,
    resizable: true,
    frame: false,
    transparent: false, //impossible to make transparent AND resizable :(
    width: cropWindow_.width,
    height: cropWindow_.height,
    x: cropWindow_.x,
    y: cropWindow_.y,
    alwaysOnTop: true
  })

  childWindow.on('close', () => {
    store.set('cropWindow', childWindow.getBounds())
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    childWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/crop.html')
  } else {
    childWindow.loadFile(join(__dirname, '../renderer/crop.html'))
  }
}

ipcMain.on('open-crop', () => {
  try {
    childWindow.show()
  } catch {
    createCropWindow(cropWindow())
  }
})

ipcMain.on('get-crop', () => {
  const crop = relativePosition(childWindow.getBounds(), getWWM())
  store.set('cropArea', crop)
})

ipcMain.on('close-crop', () => {
  childWindow.close()
})

ipcMain.on('read-chat', async (): Promise<void> => {
  const tmpImg = join(dataPath, 'tmp.png')
  unlink(tmpImg, () => {})
  logger('logScreenshot')
  await screenshot(cropArea(), tmpImg)
  logger('logOcr')
  const result = await ocr(paddleOCR, tmpImg)
  const chatLog = result.map((s) => s.text.trim()).join(' ') as string
  mainWindow.webContents.send('get-chat', chatLog)
})

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 700,
    height: 740,
    show: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// fixes for GH actions
app.commandLine.appendSwitch('disable-software-rasterizer')
app.commandLine.appendSwitch('enable-gpu-rasterization')
app.commandLine.appendSwitch('use-angle', 'd3d11')

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('where.llms.meet')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
