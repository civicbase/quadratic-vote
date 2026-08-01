import type { Meta, StoryObj } from '@storybook/react-vite'
import QuadraticVote, { LiquidPool, useQuadraticVote } from '../src/QuadraticVote'
import { Ballot, CreditsReadout, Panel, Sandbox, sampleQuestions, styles } from './harness'

/**
 * Layout patterns taken from production use. The library itself does no viewport
 * detection — these are all decisions the consuming app makes.
 */
type Args = { credits: number }

const meta: Meta<Args> = {
  title: 'Recipes',
  parameters: { layout: 'fullscreen' },
  argTypes: {
    credits: { control: { type: 'range', min: 4, max: 225, step: 1 } },
  },
  args: { credits: 100 },
}

export default meta
type Story = StoryObj<Args>

const diamondTheme = {
  neutralColor: '#D1D5DB',
  positiveColor: '#16A34A',
  negativeColor: '#DC2626',
}

/**
 * **Desktop:** a sticky sidebar holding the grid `Pool`, with the ballot scrolling
 * beside it. The pool stays in view so credits always have somewhere visible to fly
 * back to.
 */
export const DesktopSidebar: Story = {
  render: ({ credits }) => (
    <Sandbox credits={credits} questions={[...sampleQuestions, ...sampleQuestions.map(dup)]}>
      <div style={{ display: 'flex', gap: 32, padding: 24, alignItems: 'flex-start' }}>
        <aside style={{ position: 'sticky', top: 24, flexShrink: 0 }}>
          <Panel title='Your credits'>
            <QuadraticVote.Pool creditColor='#E5E7EB' circleColor='#2563EB' />
            <CreditsReadout />
          </Panel>
        </aside>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Ballot diamondProps={diamondTheme} />
        </div>
      </div>
    </Sandbox>
  ),
}

function MobileHeader() {
  const { credits, availableCredits } = useQuadraticVote()

  return (
    <header style={recipeStyles.mobileHeader}>
      <LiquidPool size={72} droplets={5} inkColor='#0F172A' />
      <div>
        <p style={recipeStyles.mobileHeaderValue}>
          {availableCredits}
          <span style={recipeStyles.mobileHeaderTotal}>/{credits}</span>
        </p>
        <span style={styles.rowCost}>credits left</span>
      </div>
    </header>
  )
}

/**
 * **Mobile:** the grid `Pool` is too tall for a phone, so it is swapped for the
 * compact `LiquidPool` in a fixed header. This is the pattern Civicbase ships —
 * the app picks the component with its own `useMediaQuery`, and the grid `Pool` is
 * not mounted at all on small screens.
 *
 * Mount only one pool at a time: two pools compete for the same flying credits.
 */
export const MobileHeaderBar: Story = {
  render: ({ credits }) => (
    <Sandbox credits={credits} questions={sampleQuestions}>
      <div style={recipeStyles.phone}>
        <MobileHeader />
        <div style={{ padding: 16 }}>
          <Ballot diamondProps={diamondTheme} layout='stacked' />
        </div>
      </div>
    </Sandbox>
  ),
}

/**
 * **Both, side by side.** Each viewport gets its own Provider so that only one
 * pool is live per tree — this is a documentation device, not something to copy
 * into an app. In real code, branch on a media query and render one or the other.
 */
export const ResponsiveComparison: Story = {
  render: ({ credits }) => (
    <div style={{ display: 'flex', gap: 32, padding: 24, alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <h3 style={styles.panelTitle}>Desktop — grid Pool</h3>
        <Sandbox credits={credits} questions={sampleQuestions}>
          <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
            <Panel title='Credits'>
              <QuadraticVote.Pool creditColor='#E5E7EB' circleColor='#2563EB' />
              <CreditsReadout />
            </Panel>
            <div style={{ flex: 1 }}>
              <Ballot diamondProps={diamondTheme} />
            </div>
          </div>
        </Sandbox>
      </div>

      <div style={{ width: 360, flexShrink: 0 }}>
        <h3 style={styles.panelTitle}>Mobile — LiquidPool header</h3>
        <Sandbox credits={credits} questions={sampleQuestions}>
          <div style={recipeStyles.phone}>
            <MobileHeader />
            <div style={{ padding: 16 }}>
              <Ballot diamondProps={diamondTheme} layout='stacked' />
            </div>
          </div>
        </Sandbox>
      </div>
    </div>
  ),
}

function SubmitBar() {
  const { credits, availableCredits, questions, reset } = useQuadraticVote()
  const allSpent = availableCredits === 0
  const cast = questions.filter((q) => q.vote !== 0).length

  return (
    <div style={recipeStyles.submitBar}>
      <span style={styles.rowCost}>
        {cast} of {questions.length} answered · {credits - availableCredits}/{credits} credits spent
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type='button' style={styles.ghostButton} onClick={reset}>
          Start over
        </button>
        <button
          type='button'
          style={{
            ...recipeStyles.primaryButton,
            opacity: allSpent ? 1 : 0.4,
            cursor: allSpent ? 'pointer' : 'not-allowed',
          }}
          disabled={!allSpent}
        >
          Submit
        </button>
      </div>
    </div>
  )
}

/**
 * **Force-spend everything.** Survey research often requires the full budget to be
 * allocated before submitting. There is no built-in flag for it — gate your own
 * submit button on `availableCredits === 0`.
 */
export const RequireFullAllocation: Story = {
  args: { credits: 36 },
  render: ({ credits }) => (
    <Sandbox credits={credits} questions={sampleQuestions}>
      <div style={{ display: 'flex', gap: 32, padding: 24, alignItems: 'flex-start' }}>
        <Panel title='Your credits'>
          <QuadraticVote.Pool creditColor='#E5E7EB' circleColor='#2563EB' />
          <CreditsReadout />
        </Panel>
        <div style={{ flex: 1 }}>
          <Ballot diamondProps={diamondTheme} />
          <SubmitBar />
        </div>
      </div>
    </Sandbox>
  ),
}

function dup(question: (typeof sampleQuestions)[number]) {
  return { ...question, id: `${question.id}-2`, question: `${question.question} (phase two)` }
}

const recipeStyles: Record<string, React.CSSProperties> = {
  phone: {
    width: 360,
    height: 640,
    overflowY: 'auto',
    border: '1px solid #E5E7EB',
    borderRadius: 24,
    background: '#F9FAFB',
    position: 'relative',
  },
  mobileHeader: {
    position: 'sticky',
    top: 0,
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '12px 16px',
    background: '#fff',
    borderBottom: '1px solid #E5E7EB',
  },
  mobileHeaderValue: {
    margin: 0,
    fontSize: 24,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  mobileHeaderTotal: {
    fontSize: 14,
    fontWeight: 400,
    color: '#6B7280',
  },
  submitBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 16,
    padding: 16,
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    background: '#fff',
  },
  primaryButton: {
    padding: '8px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#2563EB',
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
  },
}
