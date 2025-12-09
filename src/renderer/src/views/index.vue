<script setup lang="ts">
import { computed, nextTick, ref, reactive } from 'vue'
import { getSettings } from '../settings'
import emitter from '../events'
import OpenAI from 'openai'
import { getGameText } from '../chatParser'

// can't use this T.T
// const clipboardCopy = navigator.clipboard.writeText
const clipboardCopy = window.electron.clipboard.copy

const log = (s: string): void => {
  emitter.emit('log', s)
}
const settings = reactive(getSettings())

type Message = { role: 'system' | 'assistant' | 'user'; content: string }

const messagesBase: Message[] = [
  {
    role: 'system',
    content: settings.systemPrompt
  }
]

const messages = ref(structuredClone(messagesBase))

const messagesUI = computed(() =>
  messages.value.map((msg) => {
    return {
      id: '1',
      role: msg.role,
      parts: [
        {
          type: 'text',
          text: msg.content
        }
      ]
    }
  })
)

const gptClient = new OpenAI({
  baseURL: settings.url[0],
  apiKey: settings.apiKey,
  dangerouslyAllowBrowser: true
})

const chat = async (message: string): Promise<void> => {
  const chatMessages = document.querySelector('#chat-messages>div')
  messages.value.push({
    role: 'user',
    content: message
  })
  log('logChat')
  if (chatMessages) {
    await nextTick()
    chatMessages.scrollTop = chatMessages.scrollHeight
  }
  const response = await gptClient.chat.completions.create({
    model: settings.gpt[0],
    messages: messages.value
  })
  messages.value.push(response.choices[0].message as Message)
  clipboardCopy(response.choices[0].message.content ?? '')
  log('logAutoclipboard')
  if (chatMessages) {
    await nextTick()
    chatMessages.scrollTop = chatMessages.scrollHeight
  }
}

const newVariant = ref('solid')
const isDisabled = reactive({
  continue: true,
  retry: true,
  new: false
})
const isLoading = reactive({
  continue: false,
  retry: false,
  new: false
})

window.electron.chat.get(async (_event, message: string) => {
  await chat(getGameText(message, messages.value.length === 1))
  Object.keys(isDisabled).forEach((key) => (isDisabled[key] = false))
  Object.keys(isLoading).forEach((key) => (isLoading[key] = false))
  newVariant.value = 'subtle'
})

const continueClick = (): void => {
  isLoading.continue = true
  isDisabled.retry = true
  isDisabled.new = true
  window.electron.chat.ocr()
}

const retryClick = (): void => {
  messages.value.pop()
  messages.value.pop()
  isDisabled.continue = true
  isLoading.retry = true
  isDisabled.new = true
  window.electron.chat.ocr()
}

const newClick = (): void => {
  messages.value = structuredClone(messagesBase)
  isDisabled.continue = true
  isDisabled.retry = true
  isLoading.new = true
  window.electron.chat.ocr()
}
</script>

<template>
  <UChatPalette
    id="chat-messages"
    :ui="{
      root: 'h-full',
      content: 'max-h-[calc(100vh-var(--ui-header-height)-6rem)] w-full max-w-(--ui-container)',
      prompt: 'pt-4 shrink'
    }"
  >
    <UChatMessages
      class="whitespace-pre-line"
      :user="{
        side: 'right',
        variant: 'subtle'
      }"
      :assistant="{
        side: 'left',
        variant: 'outline',
        compact: true,
        avatar: {
          icon: 'i-lucide-bot'
        },
        actions: [
          {
            label: $t('copy'),
            icon: 'i-lucide-copy',
            onClick: (_event, message) => {
              clipboardCopy(message.parts[0].text)
              log('chatClipboard')
            }
          }
        ]
      }"
      :messages="messagesUI.splice(1)"
    />
    <template #prompt>
      <UContainer class="flex gap-2">
        <UButton :disabled="isDisabled.continue" @click="continueClick">{{
          $t('continue')
        }}</UButton>
        <UButton variant="subtle" :disabled="isDisabled.retry" @click="retryClick">{{
          $t('retry')
        }}</UButton>
        <UButton :variant="newVariant" :disabled="isDisabled.new" @click="newClick">{{
          $t('new')
        }}</UButton>
      </UContainer>
    </template>
  </UChatPalette>
</template>
