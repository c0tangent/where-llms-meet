import type { Rectangle } from 'electron'
import { desktopCapturer } from 'electron'
import { User32 } from 'win32-api'
import { writeFileSync } from 'node:fs'

const user32 = User32.load()
const WWM = 'Where Winds Meet'

class GuiWindow {
  name: string
  rect: Rectangle
  constructor(windowName: string) {
    this.name = windowName
    this.rect = this.getRectangle(windowName)
  }

  getRectangle(windowName: string): Rectangle {
    const hWnd = user32.FindWindowExW(0, 0, null, windowName)
    const u32rect = { left: 0, right: 0, top: 0, bottom: 0 }
    user32.GetWindowRect(hWnd, u32rect)
    return {
      x: u32rect.left,
      y: u32rect.top,
      width: u32rect.right - u32rect.left,
      height: u32rect.bottom - u32rect.top
    }
  }
}

const wwmWindow = new GuiWindow(WWM)

export const getWWM = (): Rectangle => {
  return wwmWindow.rect
}

export const relativePosition = (cropWindow: Rectangle, mainWindow: Rectangle): Rectangle => {
  return {
    x: cropWindow.x - mainWindow.x,
    y: cropWindow.y - mainWindow.y,
    width: cropWindow.width,
    height: cropWindow.height
  }
}

export const screenshot = async (relativeCropWindow: Rectangle, path: string): Promise<void> => {
  const wwm = wwmWindow
  const windows = await desktopCapturer.getSources({
    types: ['window'],
    thumbnailSize: { width: wwm.rect.width, height: wwm.rect.height }
  })
  const wwmScreen = windows.filter((s) => s.name === WWM)[0]
  const png = wwmScreen.thumbnail.crop(relativeCropWindow).toPNG()
  writeFileSync(path, png)
}

export const ocr = async (paddleOCR: any, path: string) => {
  return await paddleOCR.detect(path)
}
