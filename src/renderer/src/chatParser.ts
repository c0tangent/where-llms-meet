// first part modified from https://stackoverflow.com/a/73895717

type fuzzymatch = { weight: number; start: number; end: number; slice: string }

const levenshtein = (a: string, b: string): number => {
  const la = a.length,
    lb = b.length,
    aa = [...a, 0],
    ab = [...b, 0],
    map = ab.map(() => [...aa])
  aa.forEach((_v, i) => (map[0][i] = i))
  ab.forEach((_v, i) => (map[i][0] = i))
  for (let j = 1; j <= lb; j++) {
    for (let i = 1; i <= la; i++) {
      const n = a[i - 1] === b[j - 1] ? 0 : 1
      //@ts-expect-error man, idk i just copy from stack overflow
      map[j][i] = Math.min(map[j][i - 1] + 1, map[j - 1][i] + 1, map[j - 1][i - 1] + n)
    }
  }
  //@ts-expect-error man, idk i just copy from stack overflow
  return map[lb][la]
}

const match = (input: string, pattern: string, maxDistance: number = 3): fuzzymatch[] => {
  const ids = new Map(),
    lp = pattern.length
  for (let i = 0; i < input.length; i++) {
    const s = input.slice(i, i + lp)
    const n = levenshtein(s, pattern)
    ids.set(i, n)
  }
  const matches = [...ids].sort(([, n1], [, n2]) => n1 - n2)
  const closestDistance = matches[0][1]
  if (closestDistance > maxDistance) {
    return []
  }
  return matches
    .filter((match_) => match_[1] <= closestDistance + 1)
    .map((match_) => {
      const [id, n] = match_
      return {
        weight: Math.floor(((lp - n) / lp) * 100),
        start: id,
        end: id + lp,
        slice: input.slice(id, id + lp)
      }
    })
}

const getNPCName = (text: string): string => {
  const stranger = match(text, 'Stranger')
  try {
    return text.slice(0, stranger[0].start).trim()
  } catch {
    return text.slice(0, text.indexOf(' ')).trim()
  }
}

const getScenario = (text: string): string => {
  const stranger = match(text, 'Stranger')
  try {
    text = text.slice(stranger[0].end + 1)
  } catch {
    /* empty */
  }
  const aiInteracting = match(text, 'You are interacting with an AI bot.')
  try {
    text = text.slice(0, aiInteracting[0].start)
  } catch {
    /* empty */
  }
  return text.trim()
}

const getDialogueLines = (text: string, npcName: string): string => {
  const dialogue = match(text, npcName)
  try {
    const lastMatch = dialogue.at(-1)
    if (lastMatch) {
      text = text.slice(lastMatch.end + 1)
    }
  } catch {
    /* empty */
  }
  try {
    const bracketIndex = text.indexOf('(')
    if (bracketIndex >= 0) {
      text = text.slice(bracketIndex)
    }
  } catch {
    /* empty */
  }
  return text.trim()
}

export const getGameText = (text: string, isFirst: boolean = false): string => {
  const npcName = getNPCName(text)
  const dialogueLines = getDialogueLines(text, npcName)
  if (isFirst) {
    const scenario = getScenario(text)
    return `NPC Name: ${npcName}\nScenario: ${scenario}\nDialogue: ${dialogueLines}`
  }
  return dialogueLines
}
