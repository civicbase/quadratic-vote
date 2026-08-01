import type { Meta, StoryObj } from '@storybook/react-vite'
import QuadraticVote, { QuadraticVoteProvider } from '../src/QuadraticVote'
import { Ballot, CreditsReadout, Panel, Sandbox, sampleQuestions, shortQuestions } from './harness'

/**
 * `QuadraticVote.Provider` owns everything: vote state, budget enforcement, and
 * the `qv:*` window events that drive the pool and diamond animations. It also
 * mounts `VoteAnimation` for you.
 *
 * Two behaviours to design around:
 *
 * - **`credits` must be 4–225.** The Provider throws outside that range.
 * - **`questions` seeds state once.** The prop is read on mount and never again,
 *   so changing the ballot or the budget requires remounting with a `key`. Every
 *   story here does exactly that.
 */
const meta = {
  title: 'Components/Provider',
  component: QuadraticVoteProvider,
  parameters: { layout: 'padded' },
  argTypes: {
    credits: {
      control: { type: 'range', min: 4, max: 225, step: 1 },
      description: 'Total credit budget. Throws if below 4 or above 225.',
    },
    questions: {
      control: false,
      description: 'Seeds state on mount only. Remount with a `key` to change it.',
    },
    returnOrder: {
      control: 'inline-radio',
      options: ['first-out-last-in', 'first-out-first-in'],
      description:
        'Order in which pool circles refill when credits return from a diamond. ' +
        'Spend several votes on one question, then vote it back down to see the difference.',
    },
    children: { control: false, table: { disable: true } },
  },
  args: {
    credits: 100,
    questions: sampleQuestions,
    children: null,
    returnOrder: 'first-out-last-in',
  },
  render: ({ credits, questions, returnOrder }) => (
    <Sandbox credits={credits} questions={questions} returnOrder={returnOrder}>
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        <Panel title='Credits'>
          <QuadraticVote.Pool creditColor='#E5E7EB' circleColor='#2563EB' />
          <CreditsReadout />
        </Panel>
        <div style={{ flex: 1 }}>
          <Ballot
            diamondProps={{
              neutralColor: '#D1D5DB',
              positiveColor: '#16A34A',
              negativeColor: '#DC2626',
            }}
          />
        </div>
      </div>
    </Sandbox>
  ),
} satisfies Meta<typeof QuadraticVoteProvider>

export default meta
type Story = StoryObj<typeof meta>

/** 100 credits across four questions — 10 votes on one, or spread thinner. */
export const Default: Story = {}

/** The minimum budget. Four credits buys two votes on one question, and nothing else. */
export const MinimumCredits: Story = {
  args: { credits: 4, questions: shortQuestions },
}

/** The maximum budget. 225 credits allows 15 votes on a single question. */
export const MaximumCredits: Story = {
  args: { credits: 225 },
}

/**
 * `id` may be a string or a number, and questions carry arbitrary extra fields —
 * the Provider only requires `id` and `vote`, and passes the rest through untouched.
 */
export const NumericIds: Story = {
  args: {
    credits: 49,
    questions: [
      { id: 1, question: 'Numeric id 1', category: 'infrastructure', vote: 0 },
      { id: 2, question: 'Numeric id 2', category: 'environment', vote: 0 },
      { id: 3, question: 'Numeric id 3', category: 'education', vote: 0 },
    ],
  },
}

/**
 * Questions may start with votes already cast — useful for resuming a saved
 * response. The Provider recalculates `availableCredits` from the seeded votes.
 */
export const PrefilledVotes: Story = {
  args: {
    credits: 100,
    questions: [
      { id: 'transit', question: 'Expand the light rail network', vote: 5 },
      { id: 'housing', question: 'Rezone downtown for housing', vote: -3 },
      { id: 'parks', question: 'Convert the parking lot into a park', vote: 2 },
    ],
  },
}
