import { createMemoryHistory, createRouter } from 'vue-router'
import index from './views/index.vue'

const routes = [{ path: '/', component: index }]

export const router = createRouter({
  history: createMemoryHistory(),
  routes
})
