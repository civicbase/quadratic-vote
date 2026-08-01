import type { Meta, StoryObj } from '@storybook/react-vite'
import { LiquidPool } from '../src/QuadraticVote'
import { CreditsReadout, Panel, PlainBallot, Sandbox, shortQuestions } from './harness'

/**
 * `LiquidPool` is the compact alternative to `Pool`: the budget as a gooey blob
 * that shrinks as credits are spent and splashes droplets on every vote.
 *
 * It needs `framer-motion` as a peer dependency:
 *
 * ```bash
 * npm install framer-motion
 * ```
 *
 * The gooey effect is a blur plus a contrast filter, so it needs an opaque
 * backdrop. The default `mixBlendMode: 'screen'` halos on light backgrounds —
 * use `'normal'` if you are not placing it on a dark surface.
 */
const meta = {
  title: 'Components/LiquidPool',
  component: LiquidPool,
  parameters: { layout: 'padded' },
  argTypes: {
    shape: { control: 'inline-radio', options: ['circle', 'rect'] },
    size: {
      control: { type: 'range', min: 40, max: 240, step: 4 },
      description: 'Only used when `shape="circle"`.',
    },
    width: {
      control: { type: 'range', min: 60, max: 320, step: 4 },
      description: 'Only used when `shape="rect"`.',
    },
    height: {
      control: { type: 'range', min: 60, max: 320, step: 4 },
      description: 'Only used when `shape="rect"`.',
    },
    backgroundColor: { control: 'color' },
    inkColor: { control: 'color' },
    blurPx: { control: { type: 'range', min: 0, max: 24, step: 1 } },
    contrast: { control: { type: 'range', min: 1, max: 40, step: 1 } },
    mixBlendMode: { control: 'select', options: ['screen', 'normal', 'lighten', 'plus-lighter'] },
    liquidScale: { control: { type: 'range', min: 0.4, max: 2, step: 0.05 } },
    burstCount: { control: { type: 'range', min: 1, max: 6, step: 1 } },
    dryOutMs: { control: { type: 'range', min: 0, max: 3000, step: 100 } },
    coreScaleMode: { control: 'inline-radio', options: ['available', 'used'] },
    coreScaleMin: { control: { type: 'range', min: 0, max: 1, step: 0.05 } },
    coreScaleMax: { control: { type: 'range', min: 0, max: 2, step: 0.05 } },
  },
  args: {
    shape: 'circle',
    size: 96,
    width: 140,
    height: 140,
    backgroundColor: '#000',
    inkColor: '#fff',
    blurPx: 8,
    contrast: 18,
    mixBlendMode: 'screen',
    liquidScale: 1,
    burstCount: 1,
    dryOutMs: 0,
    coreScaleMode: 'available',
    coreScaleMin: 0.6,
    coreScaleMax: 1,
  },
  render: (args) => (
    <Sandbox credits={36} questions={shortQuestions}>
      <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        <Panel title='Liquid pool'>
          <LiquidPool {...args} />
          <CreditsReadout />
        </Panel>
        <div style={{ flex: 1 }}>
          <PlainBallot />
        </div>
      </div>
    </Sandbox>
  ),
} satisfies Meta<typeof LiquidPool>

export default meta
type Story = StoryObj<typeof meta>

/** Library defaults — the original CodePen look: white goo on black, 96px circle. */
export const Default: Story = {}

/** `shape="rect"` uses `width`/`height` instead of `size`. */
export const Rectangle: Story = {
  args: { shape: 'rect', width: 180, height: 120 },
}

/**
 * On a light surface, `mixBlendMode: 'screen'` produces a halo. Switch to
 * `'normal'` and give the blob an opaque background of its own.
 */
export const OnLightBackground: Story = {
  args: {
    mixBlendMode: 'normal',
    backgroundColor: '#EFF6FF',
    inkColor: '#2563EB',
  },
}

/**
 * `blurPx` and `contrast` control how gooey the metaballs look. Low blur plus low
 * contrast gives crisp, separate droplets; high values melt them together.
 */
export const CrispDroplets: Story = {
  args: { blurPx: 3, contrast: 8, backgroundColor: '#111827', inkColor: '#38BDF8' },
}

/** `burstCount` multiplies the droplets thrown per credit — 3 is showy. */
export const DramaticSplash: Story = {
  args: { burstCount: 3, size: 140, backgroundColor: '#0F172A', inkColor: '#FDE68A' },
}

/**
 * `coreScaleMode: 'used'` inverts the behaviour — the blob *grows* as credits are
 * spent instead of draining. Useful when you want to show commitment rather than budget.
 */
export const FillsAsYouSpend: Story = {
  args: {
    coreScaleMode: 'used',
    coreScaleMin: 0.3,
    coreScaleMax: 1.1,
    backgroundColor: '#111827',
    inkColor: '#34D399',
  },
}

/**
 * `dryOutMs` holds a drying animation before the pool goes blank at zero credits.
 * Spend everything to see it.
 */
export const DryOut: Story = {
  args: { dryOutMs: 1200, backgroundColor: '#111827', inkColor: '#F472B6' },
}

/**
 * The size the mobile header in Civicbase uses: a 96px circle, sized to sit in a
 * fixed top bar. See **Recipes / Mobile Header**.
 */
export const MobileHeaderSize: Story = {
  args: { shape: 'circle', size: 96, backgroundColor: '#0B1120', inkColor: '#E2E8F0' },
}
