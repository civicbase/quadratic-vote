import { useContext } from 'react'
import { QuadraticVote } from './QuadraticVoteProvider'

/**
 * Hook to access quadratic voting state and actions.
 *
 * Must be used within a QuadraticVoteProvider component.
 * Provides access to questions, credits, voting functions, and reset functionality.
 *
 * @returns Voting state and actions
 * @throws {Error} If used outside of QuadraticVoteProvider
 *
 * @example
 * ```tsx
 * function VotingUI() {
 *   const { questions, vote, availableCredits, reset } = useQuadraticVote()
 *
 *   return (
 *     <div>
 *       <p>Credits left: {availableCredits}</p>
 *       {questions.map(q => (
 *         <button onClick={() => vote(q.id, 1)}>Vote</button>
 *       ))}
 *       <button onClick={reset}>Reset</button>
 *     </div>
 *   )
 * }
 * ```
 */
const useQuadraticVote = () => {
  const context = useContext(QuadraticVote)

  if (!context) {
    throw new Error(`useQuadraticVote must be called inside a <QuadraticVote.Provider>`)
  }

  return context
}

export default useQuadraticVote
