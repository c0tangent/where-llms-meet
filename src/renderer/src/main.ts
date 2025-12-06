import './assets/main.css'

import { createApp } from 'vue'
import i18n from './locale/index'
import ui from '@nuxt/ui/vue-plugin'
import App from './App.vue'
import { router } from './routes'
import './settings'

const app = createApp(App)

app.use(router)
app.use(i18n)
app.use(ui)

app.mount('#app')
