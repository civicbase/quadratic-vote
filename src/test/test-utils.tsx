import { Question } from '../QuadraticVote'

export const questions: Question[] = [
  {
    question:
      'Should the city invest in a new public transportation system to reduce traffic congestion and improve sustainability?',
    qualquercoisa: 2,
    vote: 0,
    id: 0,
  },
  {
    question: 'Do you support increasing the minimum wage to $15 per hour?',
    vote: 0,
    id: 1,
  },
  {
    question: 'Should the government allocate more funding to improve public schools?',
    vote: 0,
    id: 2,
  },
  {
    question:
      'o you believe stricter environmental regulations are necessary to combat climate change?',
    vote: 0,
    id: 3,
  },
  {
    question:
      'Should the country adopt universal healthcare to provide healthcare coverage for all citizens?',
    vote: 0,
    id: 4,
  },
  {
    question:
      'Do you agree with the proposed tax policy changes aimed at reducing income inequality?',
    vote: 0,
    id: 5,
  },
]

export const questionsWithVotes: Question[] = [
  {
    question:
      'Should the city invest in a new public transportation system to reduce traffic congestion and improve sustainability?',
    qualquercoisa: 2,
    vote: 0,
    id: 0,
  },
  {
    question: 'Do you support increasing the minimum wage to $15 per hour?',
    vote: 0,
    id: 1,
  },
  {
    question: 'Should the government allocate more funding to improve public schools?',
    vote: 0,
    id: 2,
  },
  {
    question:
      'o you believe stricter environmental regulations are necessary to combat climate change?',
    vote: 0,
    id: 3,
  },
  {
    question:
      'Should the country adopt universal healthcare to provide healthcare coverage for all citizens?',
    vote: 0,
    id: 4,
  },
  {
    question:
      'Do you agree with the proposed tax policy changes aimed at reducing income inequality?',
    vote: 0,
    id: 5,
  },
]

// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react'

/**
 * Colours as a comparable value rather than a string.
 *
 * jsdom normalises computed colours differently between versions — `#A9A9A9`
 * in one, `rgb(169, 169, 169)` in the next — so assertions written against the
 * raw string break on a jsdom upgrade even though nothing about the component
 * changed. Compare through this instead.
 */
export function normalizeColor(value: string | null | undefined) {
  if (!value) return ''
  const text = value.trim()

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(text)
  if (hex) {
    const digits =
      hex[1].length === 3
        ? hex[1]
            .split('')
            .map((c) => c + c)
            .join('')
        : hex[1]
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(digits.slice(i, i + 2), 16))
    return `rgb(${r}, ${g}, ${b})`
  }

  const rgb = /^rgba?\(([^)]+)\)$/i.exec(text)
  if (rgb) {
    const [r, g, b] = rgb[1].split(/[,\s/]+/).filter(Boolean).map(Number)
    return `rgb(${r}, ${g}, ${b})`
  }

  return text.toLowerCase()
}
