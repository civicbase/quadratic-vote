import React, { ReactNode, createContext, useEffect, useState } from 'react'
import VoteAnimation, { LaunchAnimationPayload, ReturnOrder } from './VoteAnimation'

/**
 * Question object representing a votable item
 */
export type Question = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
  /** Current vote count (positive or negative) */
  vote: number
  /** Unique identifier for the question */
  id: string | number
  /** Whether voting up is disabled (auto-calculated) */
  isDisabledUp?: boolean
  /** Whether voting down is disabled (auto-calculated) */
  isDisabledDown?: boolean
}

/**
 * What a prospective vote would cost, without casting it.
 *
 * Note the cost is signed and is *not* simply `2n + 1`: that only holds while a
 * vote moves away from zero. Pressing "up" on a question sitting at -3 moves it
 * to -2 and hands 5 credits back, so `cost` is negative there.
 */
export interface VotePreview {
  /** Question the preview refers to */
  id: string | number
  /** Vote delta being previewed, usually +1 or -1 */
  delta: number
  /** Vote the question would end up on */
  nextVote: number
  /** Credits it would consume, or return when negative */
  cost: number
  /** Whether the budget allows it */
  affordable: boolean
  /** Credits missing when unaffordable, otherwise 0 */
  shortfall: number
}

/**
 * Context value provided by QuadraticVoteProvider
 */
export interface QuadraticVoteType {
  /** Array of questions with their current vote state */
  questions: Question[]
  /** Function to cast a vote on a question */
  vote: (id: string | number, vote: number) => void
  /** Total available credits for allocation */
  credits: number
  /** Remaining unallocated credits */
  availableCredits: number
  /** Function to reset all votes to zero */
  reset: () => void
  /**
   * Cost of a vote that has not been cast. Pool highlights the credits it would
   * move; read it yourself to label the control that triggered it.
   */
  preview: VotePreview | null
  /** Show what `vote(id, delta)` would cost. Pair with `clearPreview`. */
  previewVote: (id: string | number, delta: number) => void
  /** Drop the current preview. */
  clearPreview: () => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const QuadraticVote = createContext<QuadraticVoteType>(null!)

/**
 * QuadraticVoteProvider is the context provider that manages voting state.
 *
 * Wraps your voting interface and provides state management for quadratic voting.
 * Handles credit allocation, vote validation, and smooth animations.
 *
 * @param credits - Total voting credits (must be between 4-225)
 * @param questions - Array of questions to vote on
 * @param children - Your voting interface components
 * @param returnOrder - Order in which freed circles refill the pool
 *                      (default `'first-out-last-in'`)
 *
 * @example
 * ```tsx
 * const questions = [
 *   { question: 'Should we...?', vote: 0, id: 0 }
 * ]
 *
 * <QuadraticVote.Provider credits={100} questions={questions}>
 *   <YourVotingUI />
 * </QuadraticVote.Provider>
 * ```
 */
const QuadraticVoteProvider = ({
  children,
  credits,
  questions: qs,
  returnOrder,
}: {
  children: ReactNode
  credits: number
  questions: Question[]
  /** @default 'first-out-last-in' */
  returnOrder?: ReturnOrder
}) => {
  const [questions, setQuestions] = useState(qs)

  const [availableCredits, setAvailableCredits] = useState(credits)
  const [preview, setPreview] = useState<VotePreview | null>(null)

  useEffect(() => {
    const nextAvailable = credits - questions.reduce((acc, q) => acc + q.vote ** 2, 0)
    setAvailableCredits(nextAvailable)
  }, [questions, credits])

  useEffect(() => {
    if (credits < 4) {
      throw new Error('Credits must be greater than 4')
    }

    if (credits > 225) {
      throw new Error('Credits must be less than 226')
    }
  }, [credits])

  const canVote = (questions: Question[], id: string | number, potentialVote: number) => {
    let simulatedCost = 0

    questions.forEach((q) => {
      if (q.id === id) {
        simulatedCost += Math.abs(potentialVote) ** 2
      } else {
        simulatedCost += Math.abs(q.vote) ** 2
      }
    })

    return simulatedCost <= credits
  }

  /**
   * Cost lives next to `canVote` deliberately: a preview that disagrees with
   * what is actually affordable is worse than no preview at all.
   */
  const costOf = (id: string | number, delta: number) => {
    const current = questions.find((q) => q.id === id)?.vote ?? 0
    const nextVote = current + delta
    return {
      nextVote,
      cost: Math.abs(nextVote) ** 2 - Math.abs(current) ** 2,
    }
  }

  const previewVote = (id: string | number, delta: number) => {
    const { nextVote, cost } = costOf(id, delta)
    const affordable = canVote(questions, id, nextVote)
    setPreview({
      id,
      delta,
      nextVote,
      cost,
      affordable,
      shortfall: affordable ? 0 : Math.max(0, cost - availableCredits),
    })
  }

  const clearPreview = () => setPreview(null)

  const vote = (id: string | number, voteAmount: number) => {
    if (canVote(questions, id, voteAmount)) {
      const prevQuestion = questions.find((q) => q.id === id)
      const prevAbs = Math.abs(prevQuestion?.vote ?? 0)
      const updatedQuestions = questions.map((q) => {
        if (q.id === id) {
          return { ...q, vote: q.vote + voteAmount }
        }
        return q
      })

      const newQuestions = updatedQuestions.map((q) => {
        return {
          ...q,
          isDisabledUp: !canVote(updatedQuestions, q.id, q.vote + 1),
          isDisabledDown: !canVote(updatedQuestions, q.id, q.vote - 1),
        }
      })

      // compute used credits before and after
      const prevUsed = questions.reduce((acc, q) => acc + q.vote ** 2, 0)
      const nextUsed = newQuestions.reduce((acc, q) => acc + q.vote ** 2, 0)

      setQuestions(newQuestions)
      // The numbers it described are now stale.
      setPreview(null)

      // launch animation for increases or decreases
      const delta = nextUsed - prevUsed
      const nextQuestion = newQuestions.find((q) => q.id === id)
      const nextAbs = Math.abs(nextQuestion?.vote ?? 0)
      if (delta > 0 && nextAbs > prevAbs) {
        // to diamond: newly added level nextAbs
        const event = new CustomEvent<LaunchAnimationPayload>('qv:launch-animation', {
          detail: {
            direction: 'toDiamond',
            poolStartIndex: prevUsed,
            diamondId: id,
            diamondLevel: nextAbs,
            count: delta,
          },
        })
        window.dispatchEvent(event)
      } else if (delta < 0 && nextAbs < prevAbs) {
        // to pool: removed level prevAbs
        const event = new CustomEvent<LaunchAnimationPayload>('qv:launch-animation', {
          detail: {
            direction: 'toPool',
            poolStartIndex: nextUsed,
            diamondId: id,
            diamondLevel: prevAbs,
            count: Math.abs(delta),
          },
        })
        window.dispatchEvent(event)
      }
    }
  }

  const reset = () => {
    setQuestions(
      questions.map((question) => ({
        ...question,
        vote: 0,
        isDisabledDown: false,
        isDisabledUp: false,
      })),
    )
  }

  return (
    <QuadraticVote.Provider
      value={{
        credits,
        availableCredits,
        questions,
        reset,
        vote,
        preview,
        previewVote,
        clearPreview,
      }}
    >
      {children}
      <VoteAnimation returnOrder={returnOrder} />
    </QuadraticVote.Provider>
  )
}

export default QuadraticVoteProvider
