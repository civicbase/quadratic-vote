import '@testing-library/jest-dom/vitest'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import QuadraticVote, { Question, useQuadraticVote } from '../QuadraticVote'

const SPENT = 'rgb(0, 0, 0)'
const AVAILABLE = 'rgb(128, 128, 128)'
const PREVIEW = 'rgb(255, 0, 255)'

const questions: Question[] = [
  { question: 'First', vote: 0, id: 'a' },
  { question: 'Second', vote: 0, id: 'b' },
]

let api: ReturnType<typeof useQuadraticVote>

function Probe() {
  api = useQuadraticVote()
  return null
}

function Harness({ credits = 100, reverse = false }: { credits?: number; reverse?: boolean }) {
  return (
    <QuadraticVote.Provider credits={credits} questions={questions}>
      <QuadraticVote.Pool
        reverse={reverse}
        creditColor={SPENT}
        circleColor={AVAILABLE}
        previewColor={PREVIEW}
      />
      <Probe />
    </QuadraticVote.Provider>
  )
}

const act_ = (fn: () => void) => act(async () => fn())

function highlighted(container: HTMLElement) {
  return Array.from(container.querySelectorAll('svg[data-pool="true"] circle'))
    .map((c, i) => [i, c.getAttribute('fill')] as const)
    .filter(([, fill]) => fill === PREVIEW)
    .map(([i]) => i)
}

describe('vote preview', () => {
  afterEach(() => {
    cleanup()
  })

  describe('cost', () => {
    it('charges 1 for the first vote', async () => {
      render(<Harness />)
      await act_(() => api.previewVote('a', 1))

      expect(api.preview).toMatchObject({ nextVote: 1, cost: 1, affordable: true })
    })

    it('charges 2n+1 while a vote moves away from zero', async () => {
      render(<Harness />)
      for (let i = 0; i < 3; i++) await act_(() => api.vote('a', 1))

      await act_(() => api.previewVote('a', 1))

      // 4² - 3² = 7
      expect(api.preview).toMatchObject({ nextVote: 4, cost: 7 })
    })

    it('refunds when a vote moves back toward zero, rather than charging 2n+1', async () => {
      render(<Harness />)
      for (let i = 0; i < 3; i++) await act_(() => api.vote('a', -1))

      // Thumbs *up* on a question sitting at -3 moves it to -2 and hands
      // credits back. Printing 2n+1 on that button would be plain wrong.
      await act_(() => api.previewVote('a', 1))

      expect(api.preview).toMatchObject({ nextVote: -2, cost: -5 })
    })

    it('costs the same in either direction away from zero', async () => {
      render(<Harness />)
      for (let i = 0; i < 3; i++) await act_(() => api.vote('a', -1))

      await act_(() => api.previewVote('a', -1))

      expect(api.preview).toMatchObject({ nextVote: -4, cost: 7 })
    })

    it('reports the shortfall when the budget cannot cover it', async () => {
      render(<Harness credits={9} />)
      // 2 votes on each question uses 8 of 9; a third on either needs 5 more.
      await act_(() => api.vote('a', 1))
      await act_(() => api.vote('a', 1))
      await act_(() => api.vote('b', 1))
      await act_(() => api.vote('b', 1))

      await act_(() => api.previewVote('a', 1))

      expect(api.preview).toMatchObject({ cost: 5, affordable: false, shortfall: 4 })
    })

    it('clears once the vote is cast, so the numbers cannot go stale', async () => {
      render(<Harness />)
      await act_(() => api.previewVote('a', 1))
      expect(api.preview).not.toBeNull()

      await act_(() => api.vote('a', 1))

      expect(api.preview).toBeNull()
    })

    it('clears on request', async () => {
      render(<Harness />)
      await act_(() => api.previewVote('a', 1))

      await act_(() => api.clearPreview())

      expect(api.preview).toBeNull()
    })
  })

  describe('pool highlight', () => {
    it('lights the next free credits a spend would take', async () => {
      const { container } = render(<Harness />)
      for (let i = 0; i < 3; i++) await act_(() => api.vote('a', 1))

      await act_(() => api.previewVote('a', 1))

      // 9 credits already spent, the next vote costs 7.
      expect(highlighted(container)).toEqual([9, 10, 11, 12, 13, 14, 15])
    })

    it('lights the spent credits a refund would return', async () => {
      const { container } = render(<Harness />)
      for (let i = 0; i < 3; i++) await act_(() => api.vote('a', 1))

      await act_(() => api.previewVote('a', -1))

      // Dropping to 2 votes returns the last 5 of the 9 spent.
      expect(highlighted(container)).toEqual([4, 5, 6, 7, 8])
    })

    it('never highlights more than the budget can cover', async () => {
      const { container } = render(<Harness credits={9} />)
      await act_(() => api.vote('a', 1))
      await act_(() => api.vote('a', 1))
      await act_(() => api.vote('b', 1))
      await act_(() => api.vote('b', 1))

      await act_(() => api.previewVote('a', 1))

      // Needs 5 but only 1 credit is free — highlight stops at the pool's end
      // instead of running off it.
      expect(highlighted(container)).toEqual([8])
    })

    it('lights the correct end of a reversed pool', async () => {
      const { container } = render(<Harness reverse />)
      await act_(() => api.previewVote('a', 1))

      // A reversed pool fills from the far end, so the first credit is the last
      // circle drawn.
      expect(highlighted(container)).toEqual([99])
    })

    it('shows nothing when no preview is active', async () => {
      const { container } = render(<Harness />)

      expect(highlighted(container)).toEqual([])
    })
  })
})
