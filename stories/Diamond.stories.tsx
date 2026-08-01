import type { Meta, StoryObj } from '@storybook/react-vite'
import QuadraticVote, { Diamond } from '../src/QuadraticVote'
import { Ballot, CreditsReadout, Panel, Sandbox, sampleQuestions, shortQuestions } from './harness'

/**
 * `Diamond` is the per-question indicator. Each ring of circles is one vote
 * level, so the diamond's width is the vote count and its area is the credit cost —
 * the quadratic relationship is visible at a glance.
 *
 * The `id` must match a question `id` in the Provider. Positive and negative votes
 * use different colors.
 */
const meta = {
  title: 'Components/Diamond',
  component: Diamond,
  parameters: { layout: 'padded' },
  argTypes: {
    id: {
      control: false,
      description: 'Must match a question `id` in the Provider.',
    },
    neutralColor: { control: 'color' },
    positiveColor: { control: 'color' },
    negativeColor: { control: 'color' },
    circleRadius: { control: { type: 'range', min: 1, max: 12, step: 1 } },
  },
  args: {
    id: 'a',
    neutralColor: '#A9A9A9',
    positiveColor: '#00FF00',
    negativeColor: '#FF0000',
    circleRadius: 4,
  },
  render: ({ id: _id, ...args }) => (
    <Sandbox credits={64} questions={shortQuestions}>
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        <Panel title='Pool'>
          <QuadraticVote.Pool creditColor='#E5E7EB' circleColor='#2563EB' />
          <CreditsReadout />
        </Panel>
        <div style={{ flex: 1 }}>
          <Ballot diamondProps={args} />
        </div>
      </div>
    </Sandbox>
  ),
} satisfies Meta<typeof Diamond>

export default meta
type Story = StoryObj<typeof meta>

/** Library defaults — grey when neutral, pure green/red once voted. */
export const Default: Story = {}

/**
 * The stock green and red are unmodified sRGB primaries. Softer, more accessible
 * hues usually read better against white.
 */
export const Themed: Story = {
  args: {
    neutralColor: '#D1D5DB',
    positiveColor: '#16A34A',
    negativeColor: '#DC2626',
  },
}

/**
 * Vote *down* to see `negativeColor`. Negative votes cost exactly what positive
 * ones do — `(-3)² = 9` — so the diamond grows in both directions.
 */
export const NegativeVoting: Story = {
  args: {
    neutralColor: '#E5E7EB',
    positiveColor: '#0EA5E9',
    negativeColor: '#F97316',
  },
}

/** Larger circles for a denser, more prominent indicator. */
export const LargeCircles: Story = {
  args: {
    circleRadius: 7,
    neutralColor: '#E5E7EB',
    positiveColor: '#7C3AED',
    negativeColor: '#DB2777',
  },
}

/**
 * With a bigger budget the diamonds can grow much further — at 225 credits a
 * single question can absorb 15 votes.
 */
export const FullBallot: Story = {
  render: ({ id: _id, ...args }) => (
    <Sandbox credits={225} questions={sampleQuestions}>
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        <Panel title='Pool'>
          <QuadraticVote.Pool columns={15} creditColor='#E5E7EB' circleColor='#2563EB' />
          <CreditsReadout />
        </Panel>
        <div style={{ flex: 1 }}>
          <Ballot diamondProps={args} />
        </div>
      </div>
    </Sandbox>
  ),
  args: {
    neutralColor: '#D1D5DB',
    positiveColor: '#16A34A',
    negativeColor: '#DC2626',
  },
}
