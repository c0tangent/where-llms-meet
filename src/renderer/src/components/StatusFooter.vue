<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import emitter from '../events'

const logMsg = ref('ready')

window.electron.log((_event, message: string) => {
  if (message) {
    logMsg.value = message
  }
})

const handleMessage = (payload: unknown): void => {
  logMsg.value = payload as string
}

onMounted(() => {
  emitter.on('log', handleMessage)
})

onUnmounted(() => {
  emitter.off('log', handleMessage)
})
</script>

<template>
  <footer class="absolute left-0 bottom-0 pl-2 pb-1 z-100 bg-muted w-full">
    <span class="text-muted text-sm">{{ $t(logMsg) }}</span>
  </footer>
</template>
