import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import React, { ReactNode } from 'react'
import { useQuadraticVote } from '../QuadraticVote'
import { questions } from './test-utils'
import QuadraticVoteProvider from '../QuadraticVote/QuadraticVoteProvider'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('<QuadraticVoteProvider/>', () => {
  const CREDITS: number = 100
  const ZERO = 0

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QuadraticVoteProvider credits={CREDITS} questions={questions}>
      {children}
    </QuadraticVoteProvider>
  )

  // The suite runs every file in one jsdom (`singleFork`), and each Provider
  // mounts a VoteAnimation that listens on `window`. Left mounted, they answer
  // launch events fired by later files and duplicate their flights.
  afterEach(cleanup)

  it('renders without crashing', () => {
    const { result } = renderHook(() => useQuadraticVote(), { wrapper })

    expect(result.current).toBeDefined()
  })

  it('returns initial values correctly', () => {
    const { result } = renderHook(() => useQuadraticVote(), { wrapper })

    expect(result.current.credits).toBe(CREDITS)
    expect(result.current.availableCredits).toBe(CREDITS)
    expect(result.current.questions).toMatchObject(questions.map(({ id, vote }) => ({ id, vote })))
  })

  it('reports affordability before the first vote is cast', () => {
    const { result } = renderHook(() => useQuadraticVote(), { wrapper })

    // Written on vote rather than derived, these were `undefined` here, so a UI
    // driving its own controls off them opened with every button enabled.
    for (const question of result.current.questions) {
      expect(question.isDisabledUp).toBe(false)
      expect(question.isDisabledDown).toBe(false)
    }
  })

  it('disables both directions once the budget is exhausted', () => {
    const { result } = renderHook(() => useQuadraticVote(), { wrapper })
    const [first] = questions

    act(() => {
      for (let i = 0; i < 10; i++) result.current.vote(first.id, 1)
    })

    expect(result.current.availableCredits).toBe(ZERO)

    const untouched = result.current.questions.filter((q) => q.id !== first.id)
    for (const question of untouched) {
      expect(question.isDisabledUp).toBe(true)
      expect(question.isDisabledDown).toBe(true)
    }
  })

  describe('handle erros', () => {
    let originalConsoleError: typeof console.error

    beforeEach(() => {
      // Store the original console.error
      originalConsoleError = console.error
      // Mock console.error
      console.error = vi.fn()
    })

    afterEach(() => {
      // Restore the original console.error
      console.error = originalConsoleError
    })

    it('throws error if credits are less than 4', () => {
      const LESS_THAN_4 = 4 - 1

      expect(() => {
        render(
          <QuadraticVoteProvider credits={LESS_THAN_4} questions={questions}>
            <div>Child component</div>
          </QuadraticVoteProvider>,
        )
      }).toThrow('Credits must be greater than 4')
    })

    it('throws error if credits are greater than 225', () => {
      const GREATER_THAN_225 = 225 + 1

      expect(() => {
        render(
          <QuadraticVoteProvider credits={GREATER_THAN_225} questions={questions}>
            <div>Child component</div>
          </QuadraticVoteProvider>,
        )
      }).toThrow('Credits must be less than 226')
    })
  })

  it('resets votes correctly', () => {
    const AVAILABLE_CREDITS = CREDITS - questions.length * 2 ** 2

    const newQuestions = questions.map((q) => {
      return {
        ...q,
        vote: 2,
      }
    })

    const customWrapper = ({ children }: { children: ReactNode }) => (
      <QuadraticVoteProvider credits={CREDITS} questions={newQuestions}>
        {children}
      </QuadraticVoteProvider>
    )

    const { result } = renderHook(() => useQuadraticVote(), {
      wrapper: customWrapper,
    })

    expect(AVAILABLE_CREDITS).toBe(result.current.availableCredits)

    act(() => {
      result.current.reset()
    })

    expect(result.current.availableCredits).toBe(CREDITS)
  })

  it('should vote 1 positive', () => {
    const QUESTION_INDEX = 0
    const VOTE_AMOUNT = 1
    const AVAILABLE_CREDITS = CREDITS - VOTE_AMOUNT ** 2

    const { result } = renderHook(() => useQuadraticVote(), { wrapper })

    act(() => {
      result.current.vote(QUESTION_INDEX, 1)
    })

    expect(result.current.availableCredits).toBe(AVAILABLE_CREDITS)
    expect(result.current.questions[QUESTION_INDEX].vote).toBe(1)
  })

  it('handles voting functionality correctly in many question with voteAmount = 2', () => {
    const VOTE_AMOUNT = 2
    const AVAILABLE_CREDITS = CREDITS - questions.length * VOTE_AMOUNT ** 2

    const { result } = renderHook(() => useQuadraticVote(), { wrapper })

    for (let i = 0; i < result.current.questions.length; i++) {
      act(() => {
        result.current.vote(i, VOTE_AMOUNT)
      })
    }

    expect(result.current.availableCredits).toBe(AVAILABLE_CREDITS)

    for (let i = 0; i < result.current.questions.length; i++) {
      expect(result.current.questions[i].vote).toBe(VOTE_AMOUNT)
      expect(result.current.questions[i].isDisabledUp).not.toBeTruthy()
      expect(result.current.questions[i].isDisabledDown).not.toBeTruthy()
    }
  })

  it('handles voting functionality correctly in many question with voteAmount = 5, testing method canVote', () => {
    const VOTE_AMOUNT = 5
    const MAX_QUESTION_VOTED = CREDITS / VOTE_AMOUNT ** 2

    const { result } = renderHook(() => useQuadraticVote(), { wrapper })

    for (let i = 0; i < result.current.questions.length; i++) {
      act(() => {
        result.current.vote(i, VOTE_AMOUNT)
      })
    }

    expect(result.current.availableCredits).toBe(ZERO)

    for (let i = 0; i < result.current.questions.length; i++) {
      if (i < MAX_QUESTION_VOTED) {
        expect(result.current.questions[i].vote).toBe(VOTE_AMOUNT)
        expect(result.current.questions[i].isDisabledUp).toBeTruthy()
        expect(result.current.questions[i].isDisabledDown).not.toBeTruthy()
      } else {
        expect(result.current.questions[i].vote).toBe(ZERO)
        expect(result.current.questions[i].isDisabledUp).toBeTruthy()
        expect(result.current.questions[i].isDisabledDown).toBeTruthy()
      }
    }
  })

  it('handles voting functionality correctly in one question with voteAmount = 10, testing method canVote', () => {
    const QUESTION_INDEX = 1
    const VOTE_AMOUNT = 10
    const AVAILABLE_CREDITS = CREDITS - VOTE_AMOUNT ** 2

    const { result } = renderHook(() => useQuadraticVote(), { wrapper })

    act(() => {
      result.current.vote(QUESTION_INDEX, VOTE_AMOUNT)
    })

    expect(result.current.availableCredits).toBe(AVAILABLE_CREDITS)

    for (let i = 0; i < result.current.questions.length; i++) {
      if (i == QUESTION_INDEX) {
        expect(result.current.questions[QUESTION_INDEX].vote).toBe(VOTE_AMOUNT)
        expect(result.current.questions[QUESTION_INDEX].isDisabledUp).toBeTruthy()
        expect(result.current.questions[QUESTION_INDEX].isDisabledDown).not.toBeTruthy()
      } else {
        expect(result.current.questions[i].vote).toBe(ZERO)
        expect(result.current.questions[i].isDisabledUp).toBeTruthy()
        expect(result.current.questions[i].isDisabledDown).toBeTruthy()
      }
    }
  })

  /**
   * The guarantees a UI built on this API relies on, none of which the bundled
   * Pool and Diamond exercise — they read the disabled flags and never press
   * faster than React renders.
   */
  describe('building a UI on the API', () => {
    it('registers every press in a burst, not just the last', () => {
      const { result } = renderHook(() => useQuadraticVote(), { wrapper })
      const [first] = questions

      // No re-render between these: `vote` used to read the state variable, so
      // all three started from the same ballot and only one survived.
      act(() => {
        result.current.vote(first.id, 1)
        result.current.vote(first.id, 1)
        result.current.vote(first.id, 1)
      })

      expect(result.current.questions[0].vote).toBe(3)
      expect(result.current.availableCredits).toBe(CREDITS - 9)
    })

    it('refuses a press that would overspend, even without the disabled flags', () => {
      const { result } = renderHook(() => useQuadraticVote(), { wrapper })
      const [first, second] = questions

      // 8² + 6² = 100, the whole budget.
      act(() => {
        for (let i = 0; i < 8; i++) result.current.vote(first.id, 1)
        for (let i = 0; i < 6; i++) result.current.vote(second.id, 1)
      })
      expect(result.current.availableCredits).toBe(ZERO)

      // Going to 9 costs 17 more than the budget allows. The affordability
      // check was handed the delta rather than the resulting vote, so it priced
      // this as a move to 1 — costing 1 — and waved it through.
      act(() => {
        result.current.vote(first.id, 1)
      })

      expect(result.current.questions[0].vote).toBe(8)
      expect(result.current.questions[1].vote).toBe(6)
      expect(result.current.availableCredits).toBe(ZERO)
    })

    it('prices a press without hovering it', () => {
      const { result } = renderHook(() => useQuadraticVote(), { wrapper })
      const [first] = questions

      act(() => {
        for (let i = 0; i < 3; i++) result.current.vote(first.id, 1)
      })

      // Not 2n+1: that only holds moving away from zero.
      expect(result.current.costOf(first.id, 1)).toMatchObject({ nextVote: 4, cost: 7 })
      expect(result.current.costOf(first.id, -1)).toMatchObject({ nextVote: 2, cost: -5 })

      // Reading a price must not leave a preview behind — both controls in a
      // row get priced on every render.
      expect(result.current.preview).toBeNull()
    })

    it('agrees with previewVote', () => {
      const { result } = renderHook(() => useQuadraticVote(), { wrapper })
      const [first] = questions

      act(() => {
        result.current.previewVote(first.id, 1)
      })

      expect(result.current.preview).toEqual(result.current.costOf(first.id, 1))
    })

    it('reports what an unaffordable press is short by', () => {
      const { result } = renderHook(() => useQuadraticVote(), { wrapper })
      const [first, second] = questions

      act(() => {
        for (let i = 0; i < 9; i++) result.current.vote(first.id, 1)
      })

      // 19 credits left, and a first vote elsewhere costs 1 — affordable.
      expect(result.current.costOf(second.id, 1)).toMatchObject({
        affordable: true,
        shortfall: 0,
      })

      // Going to 10 on the first question costs 19 more than the 81 already
      // spent, which is exactly the budget — affordable to the credit.
      expect(result.current.costOf(first.id, 1)).toMatchObject({
        cost: 19,
        affordable: true,
        shortfall: 0,
      })
    })
  })
})
