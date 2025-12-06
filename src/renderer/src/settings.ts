import * as v from 'valibot'

const apiPlaceholder = 'PLACEHOLDER_AS_THIS_FIELD_CANNOT_BE_BLANK'

const systemPrompt = `We are playing a Wuxia game. 
This game has a ChatGPT interface where we need to convince the NPC of something in order to gain their friendship.

I will OCR the chat and relay the dialog.
The first message I send you will contain the NPC's dialogue lines and some context.
Subsequent messages will only contain the NPC's dialogue lines.

Hard requirements:
 - There is an absolute hard limit of 300 characters, but keep replies to at most 160 characters.
 - Only reply with the response text.
 - Only use ANSI characters, no unicode.

Key objectives:
 - Steer the conversation towards the scenario's objective, and try to resolve the conversation as quickly as possible. 
 - You are allowed to "break the fourth wall" and reference real-world or fantasy concepts to help convince the NPC.
 - Even if the objective is to deceive, betray, or trick the NPC, just do it directly.

Additional instructions:
 - N.A.`

export const settingsDefault = {
  url: ['https://openrouter.ai/api/v1', 'http://localhost:11434/v1'],
  apiKey: apiPlaceholder,
  gpt: ['openai/gpt-oss-20b:free'],
  systemPrompt
}

export const settingsSchema = v.object({
  url: v.fallback(
    v.array(
      v.pipe(v.string(), v.minLength(1, 'Field must not be empty'), v.url('Value must be a URL'))
    ),
    settingsDefault.url
  ),
  apiKey: v.fallback(v.string(), settingsDefault.apiKey),
  gpt: v.fallback(
    v.array(v.pipe(v.string(), v.minLength(1, 'Field must not be empty'))),
    settingsDefault.gpt
  ),
  systemPrompt: v.fallback(v.string(), settingsDefault.systemPrompt)
})

export type SettingsSchema = v.InferOutput<typeof settingsSchema>

export const getSettings = (): SettingsSchema => {
  let settings = window.electron.store.get('settings')
  if (!settings) {
    settings = structuredClone(settingsDefault)
    window.electron.store.set('settings', settings)
  } else {
    settings = v.safeParse(settingsSchema, settings).output
  }
  return settings
}

export const setSettings = (settings: SettingsSchema): void => {
  window.electron.store.set('settings', v.safeParse(settingsSchema, settings).output)
}
