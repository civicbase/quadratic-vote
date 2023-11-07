import '@testing-library/jest-dom/vitest'
import { act, render, renderHook } from '@testing-library/react'
import React from 'react'
import { ReactElement } from 'react'
import { useQuadraticVote } from '../QuadraticVote'
import { questions } from './test-utils'
import QuadraticVoteProvider from '../QuadraticVote/QuadraticVoteProvider'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('<QuadraticVoteProvider/>', () => {
  const CREDITS: number = 100
  const ZERO = 0

  const wrapper = ({ children }: { children: ReactElement }) => (
    <QuadraticVoteProvider credits={CREDITS} questions={questions}>
      {children}
    </QuadraticVoteProvider>
  )

  it('renders without crashing', () => {
    const { result } = renderHook(() => useQuadraticVote(), { wrapper })

    expect(result.current).toBeDefined()
  })

  it('returns initial values correctly', () => {
    const { result } = renderHook(() => useQuadraticVote(), { wrapper })

    expect(result.current.credits).toBe(CREDITS)
    expect(result.current.availableCredits).toBe(CREDITS)
    expect(result.current.questions).toBe(questions)
  })

  describe('handle erros', () => {
    let originalConsoleError: any

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
          <QuadraticVoteProvider
            credits={GREATER_THAN_225}
            questions={questions}
          >
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

    const customWrapper = ({ children }: { children: ReactElement }) => (
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
        expect(
          result.current.questions[QUESTION_INDEX].isDisabledUp,
        ).toBeTruthy()
        expect(
          result.current.questions[QUESTION_INDEX].isDisabledDown,
        ).not.toBeTruthy()
      } else {
        expect(result.current.questions[i].vote).toBe(ZERO)
        expect(result.current.questions[i].isDisabledUp).toBeTruthy()
        expect(result.current.questions[i].isDisabledDown).toBeTruthy()
      }
    }
  })
})
