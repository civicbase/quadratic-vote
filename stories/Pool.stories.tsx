import type { Meta, StoryObj } from '@storybook/react-vite'
import { Pool } from '../src/QuadraticVote'
import { CreditsReadout, Panel, PlainBallot, Sandbox, shortQuestions } from './harness'

/**
 * `Pool` draws the credit budget as a grid of circles. Filled circles are still
 * available; the rest have been spent. Credits animate out to a `Diamond` when
 * allocated and fly back when deallocated.
 *
 * Render **one** pool per Provider — two pools compete for the same flying credits.
 *
 * Hover or tab to a `-`/`+` button in the ballot to see what that vote would
 * cost: the pool lights the exact credits it would take, or the ones it would
 * hand back. Wire it with `previewVote(id, delta)` / `clearPreview()` from
 * `useQuadraticVote()`.
 */
const meta = {
  title: 'Components/Pool',
  component: Pool,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    columns: { control: { type: 'range', min: 1, max: 20, step: 1 } },
    circleRadius: { control: { type: 'range', min: 1, max: 16, step: 1 } },
    circleSpacing: { control: { type: 'range', min: 0, max: 20, step: 1 } },
    reverse: { control: 'boolean' },
    creditColor: { control: 'color' },
    circleColor: { control: 'color' },
    previewColor: { control: 'color' },
  },
  args: {
    columns: 5,
    circleRadius: 4,
    circleSpacing: 4,
    reverse: false,
    creditColor: 'black',
    circleColor: 'grey',
    previewColor: '#F59E0B',
  },
  render: (args) => (
    <Sandbox credits={36} questions={shortQuestions}>
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        <Panel title='Pool'>
          <Pool {...args} />
          <CreditsReadout />
        </Panel>
        <div style={{ flex: 1 }}>
          <PlainBallot />
        </div>
      </div>
    </Sandbox>
  ),
} satisfies Meta<typeof Pool>

export default meta
type Story = StoryObj<typeof meta>

/** Library defaults: a 5-column grid, black spent credits on grey. */
export const Default: Story = {}

/**
 * `creditColor` is the *spent* credit and `circleColor` is the *available* one —
 * easy to get backwards. Here available credits are blue and spent ones fade to grey.
 */
export const Themed: Story = {
  args: {
    creditColor: '#E5E7EB',
    circleColor: '#2563EB',
    circleRadius: 5,
    circleSpacing: 5,
  },
}

/** `reverse` fills from the bottom up instead of the top down. */
export const Reversed: Story = {
  args: { reverse: true, creditColor: '#E5E7EB', circleColor: '#059669' },
}

/** A wide, flat pool suits a horizontal header strip. */
export const WideStrip: Story = {
  args: {
    columns: 18,
    circleRadius: 3,
    circleSpacing: 3,
    creditColor: '#E5E7EB',
    circleColor: '#111827',
  },
}

/** A single column reads as a vertical meter. */
export const SingleColumn: Story = {
  args: {
    columns: 1,
    circleRadius: 6,
    circleSpacing: 3,
    creditColor: '#F3F4F6',
    circleColor: '#DC2626',
  },
}
