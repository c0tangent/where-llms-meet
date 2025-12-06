import { createI18n } from 'vue-i18n'
import en from './en'

export interface Lang {
  [key: string]: string
}

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  availableLocales: ['en'],
  messages: {
    en: en
  }
})

export default i18n
