import React, { ReactNode, createContext, useEffect, useMemo, useRef, useState } from 'react'
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
  /**
   * What `vote(id, delta)` would cost, without casting it and without touching
   * `preview`.
   *
   * `preview` is driven by hover, so it can only ever describe one control at a
   * time. A UI that labels both an up and a down control at once — or that
   * shows a price on a touch device, where there is no hover — needs the same
   * numbers without the state. This is the function behind `previewVote`, so
   * the two can never disagree.
   */
  costOf: (id: string | number, delta: number) => VotePreview
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
  const [preview, setPreview] = useState<VotePreview | null>(null)

  /**
   * `vote` reads the ballot through this rather than through `questions`.
   *
   * Reading the state variable meant every press in a single tick started from
   * the same snapshot and overwrote the last, so a burst of clicks — a fast
   * double-click, a test firing without awaiting a render — collapsed into one
   * registered vote.
   */
  const questionsRef = useRef(questions)
  useEffect(() => {
    questionsRef.current = questions
  }, [questions])

  // Derived, not stored: held in state it trailed the ballot by a render, and
  // anything reading it during that gap — a shortfall, a disabled control —
  // was answering with the previous question's budget.
  const availableCredits = credits - questions.reduce((acc, q) => acc + q.vote ** 2, 0)

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
  const costOf = (id: string | number, delta: number): VotePreview => {
    const current = questions.find((q) => q.id === id)?.vote ?? 0
    const nextVote = current + delta
    const cost = Math.abs(nextVote) ** 2 - Math.abs(current) ** 2
    const affordable = canVote(questions, id, nextVote)

    return {
      id,
      delta,
      nextVote,
      cost,
      affordable,
      shortfall: affordable ? 0 : Math.max(0, cost - availableCredits),
    }
  }

  const previewVote = (id: string | number, delta: number) => setPreview(costOf(id, delta))

  const clearPreview = () => setPreview(null)

  /**
   * Affordability flags, derived on read rather than written when a vote lands.
   *
   * Stored, they were only ever filled in by `vote`, so before the first press
   * they were `undefined` and a UI driving its controls off them started with
   * every button enabled. They also went stale whenever `credits` changed
   * underneath a ballot that had not been touched since.
   */
  const decoratedQuestions = useMemo(
    () =>
      questions.map((question) => ({
        ...question,
        isDisabledUp: !canVote(questions, question.id, question.vote + 1),
        isDisabledDown: !canVote(questions, question.id, question.vote - 1),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [questions, credits],
  )

  const vote = (id: string | number, voteAmount: number) => {
    const current = questionsRef.current
    const prevQuestion = current.find((q) => q.id === id)
    const prevVote = prevQuestion?.vote ?? 0

    // The second argument is the vote the question would *land on*, not the
    // delta. Passing the delta priced a press on a question already at 5 as if
    // it were a press to 1, so a custom UI that trusted `vote` rather than the
    // disabled flags could spend past the budget.
    if (canVote(current, id, prevVote + voteAmount)) {
      const prevAbs = Math.abs(prevVote)
      const newQuestions = current.map((q) =>
        q.id === id ? { ...q, vote: q.vote + voteAmount } : q,
      )

      // compute used credits before and after
      const prevUsed = current.reduce((acc, q) => acc + q.vote ** 2, 0)
      const nextUsed = newQuestions.reduce((acc, q) => acc + q.vote ** 2, 0)

      // Advance the ref before returning, so a second press in this same tick
      // starts from this ballot rather than from the one React last rendered.
      questionsRef.current = newQuestions
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
    const cleared = questionsRef.current.map((question) => ({ ...question, vote: 0 }))
    questionsRef.current = cleared
    setQuestions(cleared)
    setPreview(null)
  }

  return (
    <QuadraticVote.Provider
      value={{
        credits,
        availableCredits,
        questions: decoratedQuestions,
        reset,
        vote,
        preview,
        previewVote,
        clearPreview,
        costOf,
      }}
    >
      {children}
      <VoteAnimation returnOrder={returnOrder} />
    </QuadraticVote.Provider>
  )
}

export default QuadraticVoteProvider
