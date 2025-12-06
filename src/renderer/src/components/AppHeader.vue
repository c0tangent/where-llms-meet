<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { settingsSchema, getSettings, setSettings } from '../settings'

const settings = reactive(getSettings())

const _url = ref(settings.url[0])
const _gpt = ref(settings.gpt[0])
const showSaved = ref(false)

const moveToFirst = (arr: string[], value: string): void => {
  const fromIndex = arr.indexOf(value)
  arr.splice(fromIndex, 1)
  arr.unshift(value)
}

watch(_url, (newUrl) => {
  moveToFirst(settings.url, newUrl)
})

const onCreateUrl = (item: string): void => {
  settings.url.unshift(item)
}

watch(_gpt, (newGpt) => {
  moveToFirst(settings.gpt, newGpt)
})

const onCreateGpt = (item: string): void => {
  settings.gpt.unshift(item)
}

const isCropOpen = ref(false)

const onSubmit = (): void => {
  if (isCropOpen.value) {
    window.electron.crop.get()
  }
  setSettings(settings)
  showSaved.value = true
  if (isCropOpen.value) {
    isCropOpen.value = false
    window.electron.crop.close()
  }
}

const openCropper = (): void => {
  isCropOpen.value = true
  window.electron.crop.open()
}
</script>

<template>
  <UHeader :toggle="{ icon: 'i-lucide-settings' }">
    <template #title>
      <UIcon name="i-lucide-bot" class="size-8" />
    </template>
    <template #body>
      <UForm :schema="settingsSchema" :state="settings" class="space-y-4" @submit="onSubmit">
        <UFormField :label="$t('url')" name="url">
          <USelectMenu
            v-model="_url"
            class="w-72"
            :items="settings.url"
            :default-item="settings.url[0]"
            create-item
            @create="onCreateUrl"
          />
        </UFormField>

        <UFormField :label="$t('apiKey')" name="apiKey">
          <UInput v-model="settings.apiKey" class="w-72" type="password" />
        </UFormField>

        <UFormField :label="$t('gpt')" name="apiKey">
          <USelectMenu
            v-model="_gpt"
            class="w-72"
            :items="settings.gpt"
            :default-item="settings.gpt[0]"
            create-item
            @create="onCreateGpt"
          />
        </UFormField>

        <UFormField :label="$t('systemPrompt')" name="systemPrompt">
          <UTextarea v-model="settings.systemPrompt" class="w-full" :rows="12" />
        </UFormField>
        <div class="flex gap-2">
          <UButton @click="openCropper()"> Chat Bounds </UButton>
          <UButton type="submit"> Save </UButton>
        </div>
        <em v-if="showSaved" class="text-sm">{{ $t('saved') }}</em>
      </UForm>
    </template>
  </UHeader>
</template>
