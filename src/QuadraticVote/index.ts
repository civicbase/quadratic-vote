import Provider from './QuadraticVoteProvider'
import Pool from './Pool'
import Diamond from './Diamond'

export const QuadraticVote = {
  Provider,
  Pool,
  Diamond,
}

export type { Question } from './QuadraticVoteProvider'
export { default as useQuadraticVote } from './useQuadraticVote'
