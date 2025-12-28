import Provider from './QuadraticVoteProvider'
import Pool from './Pool'
import Diamond from './Diamond'
import LiquidPool from './LiquidPool'

// Default export with namespace pattern (current usage)
export default {
  Provider,
  Pool,
  LiquidPool,
  Diamond,
}

// Named exports for more flexible usage
export { default as QuadraticVoteProvider } from './QuadraticVoteProvider'
export { default as Pool } from './Pool'
export { default as LiquidPool } from './LiquidPool'
export { default as Diamond } from './Diamond'
export { default as useQuadraticVote } from './useQuadraticVote'
export { default as VoteAnimation } from './VoteAnimation'

// Type exports
export type { Question, QuadraticVoteType } from './QuadraticVoteProvider'
export type { DiamondProps } from './Diamond'
export type { PoolProps } from './Pool'
export type { LiquidPoolProps } from './LiquidPool'
export type { LaunchAnimationPayload, VoteAnimationProps } from './VoteAnimation'
