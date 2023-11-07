import { useContext } from 'react'
import { QuadraticVote, QuadraticVoteType } from './QuadraticVoteProvider'

const useQuadraticVote = () => {
  const context = useContext(QuadraticVote)

  if (!context) {
    throw new Error(
      `useQuadraticVote must be called inside a <QuadraticVote.Provider>`,
    )
  }

  return context
}

export default useQuadraticVote
