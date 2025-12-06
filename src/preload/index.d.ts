import { electron } from './index'

declare global {
  interface Window {
    electron: typeof electron
  }
}
