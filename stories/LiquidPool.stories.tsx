import type { Meta, StoryObj } from '@storybook/react-vite'
import { LiquidPool } from '../src/QuadraticVote'
import { Ballot, CreditsReadout, Panel, Sandbox, shortQuestions } from './harness'

/**
 * `LiquidPool` renders the budget as a floating drop of water with satellite
 * droplets orbiting it, rather than a grid of circles.
 *
 * The blobs are plain SVG circles fused by a gooey filter — `feGaussianBlur`
 * smears neighbouring shapes together and `feColorMatrix` pushes the blurred
 * alpha back to a hard edge. Because that works on the alpha channel it needs no
 * opaque backdrop, and the filter region extends past the component box, so
 * droplets and splashes are never clipped.
 *
 * `size` reserves a square footprint for layout; the liquid is free to drift
 * outside it.
 *
 * Spend and refund credits in the ballot beside it to watch the pool drain and
 * refill — droplets dry out one at a time as the budget runs down, and each credit
 * leaving or arriving throws a splash off the surface facing its diamond.
 */
const meta = {
  title: 'Components/LiquidPool',
  component: LiquidPool,
  parameters: { layout: 'padded' },
  argTypes: {
    size: {
      control: { type: 'range', min: 60, max: 260, step: 4 },
      description: 'Reserved layout footprint. The liquid may drift beyond it.',
    },
    inkColor: { control: 'color' },
    droplets: { control: { type: 'range', min: 0, max: 14, step: 1 } },
    spread: { control: { type: 'range', min: 0, max: 1.2, step: 0.02 } },
    wobble: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    driftSeconds: { control: { type: 'range', min: 3, max: 40, step: 1 } },
    viscosity: { control: { type: 'range', min: 0.02, max: 0.3, step: 0.01 } },
    settleMs: { control: { type: 'range', min: 100, max: 3000, step: 100 } },
  },
  args: {
    size: 120,
    inkColor: '#ffffff',
    droplets: 6,
    spread: 0.42,
    wobble: 0.55,
    driftSeconds: 14,
    viscosity: 0.16,
    settleMs: 900,
  },
  render: (args) => (
    <Sandbox credits={36} questions={shortQuestions}>
      <div style={{ display: 'flex', gap: 64, alignItems: 'flex-start' }}>
        <Panel title='Liquid pool'>
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
            <LiquidPool {...args} />
          </div>
          <CreditsReadout />
        </Panel>
        <div style={{ flex: 1 }}>
          <Ballot />
        </div>
      </div>
    </Sandbox>
  ),
} satisfies Meta<typeof LiquidPool>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Defaults. White liquid, so this reads best on a dark surface — set
 * `inkColor` to something darker for a light page.
 */
export const Default: Story = {
  args: { inkColor: '#0F172A' },
}

/** A single drop with nothing orbiting it. */
export const NoDroplets: Story = {
  args: { droplets: 0, inkColor: '#0F172A' },
}

/** A dense cluster. Droplets stay between 15% and 35% of the main blob. */
export const ManyDroplets: Story = {
  args: { droplets: 12, spread: 0.6, inkColor: '#2563EB' },
}

/**
 * `wobble` controls how far the main blob's lobes push out of round. At `0` it
 * settles into a near-perfect circle; higher values give it a lopsided,
 * water-drop silhouette.
 */
export const PerfectlyRound: Story = {
  args: { wobble: 0, inkColor: '#0F172A' },
}

/** Maximum irregularity — the drop never quite settles into a shape. */
export const VeryOrganic: Story = {
  args: { wobble: 1, droplets: 8, inkColor: '#7C3AED' },
}

/**
 * `viscosity` is how readily the liquid fuses. Low values keep the droplets
 * distinct; high values pull everything into one mass.
 */
export const Runny: Story = {
  args: { viscosity: 0.04, droplets: 8, inkColor: '#0EA5E9' },
}

/** Thick and syrupy — droplets merge into the main blob from further away. */
export const Thick: Story = {
  args: { viscosity: 0.22, droplets: 8, inkColor: '#059669' },
}

/** Slow, barely-moving liquid. Raise `driftSeconds` to calm it down. */
export const BarelyMoving: Story = {
  args: { driftSeconds: 34, inkColor: '#0F172A' },
}

/**
 * `settleMs` governs how quickly the pool reacts to a vote. Long settle times
 * make spending credits read as the liquid slowly draining away.
 */
export const SlowToSettle: Story = {
  args: { settleMs: 2500, inkColor: '#DB2777', droplets: 8 },
}

/**
 * The size Civicbase uses in its mobile header. See **Recipes / Mobile Header**.
 */
export const MobileHeaderSize: Story = {
  args: { size: 72, droplets: 5, inkColor: '#E2E8F0' },
  render: (args) => (
    <Sandbox credits={36} questions={shortQuestions}>
      <div
        style={{
          background: '#0B1120',
          borderRadius: 16,
          padding: '24px 32px',
          display: 'inline-flex',
        }}
      >
        <LiquidPool {...args} />
      </div>
    </Sandbox>
  ),
}
