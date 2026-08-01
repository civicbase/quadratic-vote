import type { Meta, StoryObj } from '@storybook/react-vite'
import QuadraticVote from '../src/QuadraticVote'
import { Ballot, CreditsReadout, Panel, Sandbox, sampleQuestions } from './harness'

/**
 * A complete, working ballot — the smallest thing that is actually useful.
 *
 * Spend credits with the +/- buttons and watch them fly from the pool into each
 * diamond. When the budget runs out the buttons disable themselves.
 */
type Args = { credits: number }

const meta: Meta<Args> = {
  title: 'Getting Started',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The Provider owns the state; the Pool renders the budget; a Diamond renders each ' +
          "question's allocation. Everything else is your own markup.",
      },
    },
  },
  argTypes: {
    credits: {
      control: { type: 'range', min: 4, max: 225, step: 1 },
      description: 'Total credit budget. Must be between 4 and 225.',
    },
  },
  args: {
    credits: 100,
  },
}

export default meta
type Story = StoryObj<Args>

export const CompleteBallot: Story = {
  render: ({ credits }) => (
    <Sandbox credits={credits} questions={sampleQuestions}>
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        <Panel title='Your credits'>
          <QuadraticVote.Pool creditColor='#E5E7EB' circleColor='#2563EB' />
          <CreditsReadout />
        </Panel>

        <div style={{ flex: 1 }}>
          <Ballot />
        </div>
      </div>
    </Sandbox>
  ),
}

/**
 * A tight budget makes the quadratic cost obvious: at 16 credits you can buy
 * four votes on one question, or two votes each on four questions.
 */
export const TightBudget: Story = {
  args: { credits: 16 },
  render: CompleteBallot.render,
}
