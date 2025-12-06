<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import * as locales from '@nuxt/ui/locale'
import StatusFooter from './components/StatusFooter.vue'
import AppHeader from './components/AppHeader.vue'

const { locale } = useI18n()
</script>

<template>
  <UApp :locale="locales[locale]">
    <AppHeader />
    <UMain class="h-[calc(100vh-var(--ui-header-height))]">
      <RouterView />
    </UMain>
    <StatusFooter />
  </UApp>
</template>
