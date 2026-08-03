import { CSSProperties, ReactNode, useEffect, useState } from 'react'
import QuadraticVote, { Question, useQuadraticVote } from '../src/QuadraticVote'
import { ThumbsDownIcon, ThumbsUpIcon } from './icons'
import Toolbar, { Device, PoolKind } from './Toolbar'
import { ThemeProvider, useTheme } from './theme'

/**
 * Simulated viewports. Mobile and tablet stack the pool above the questions
 * inside a device-width frame; desktop gets the full page with a fixed rail.
 *
 * The grid pool needs a tall sidebar it cannot have on a phone, so mobile and
 * tablet always use the liquid pool — which is exactly the swap Civicbase makes
 * in production.
 */
const DEVICES: Record<Device, { width: number | null; poolSize: number; droplets: number }> = {
  mobile: { width: 390, poolSize: 84, droplets: 5 },
  tablet: { width: 834, poolSize: 112, droplets: 6 },
  desktop: { width: null, poolSize: 140, droplets: 7 },
}

/**
 * Desktop only: below this the fixed rail would overlap the centred column, so
 * it stacks even when the desktop preview is selected.
 */
const WIDE_QUERY = '(min-width: 1100px)'

function useIsWide() {
  const [isWide, setIsWide] = useState(() => window.matchMedia(WIDE_QUERY).matches)

  useEffect(() => {
    const query = window.matchMedia(WIDE_QUERY)
    const handleChange = (event: MediaQueryListEvent) => setIsWide(event.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return isWide
}

function PoolRail({ poolKind, device }: { poolKind: PoolKind; device: Device }) {
  const { theme } = useTheme()
  const preset = DEVICES[device]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <span style={{ ...text.eyebrow, color: theme.textMuted }}>Credits</span>

      {/* Only one pool is ever mounted — two would compete for the same flying credits. */}
      {poolKind === 'grid' ? (
        <QuadraticVote.Pool
          columns={5}
          circleRadius={5}
          circleSpacing={5}
          creditColor={theme.poolCredit}
          circleColor={theme.poolCircle}
        />
      ) : (
        <QuadraticVote.LiquidPool
          size={preset.poolSize}
          inkColor={theme.liquidInk}
          droplets={preset.droplets}
        />
      )}
    </div>
  )
}

/**
 * What pressing a thumb would cost. Not `2n + 1`: that only holds while a vote
 * moves away from zero — thumbs-up on a question sitting at -3 hands 5 credits
 * back rather than charging 7.
 */
function costOfPress(currentVote: number, delta: number) {
  return Math.abs(currentVote + delta) ** 2 - Math.abs(currentVote) ** 2
}

function QuestionCard({ question, index }: { question: Question; index: number }) {
  const { vote } = useQuadraticVote()
  const { theme } = useTheme()
  const cost = question.vote ** 2

  return (
    <li
      style={{
        ...layout.card,
        background: theme.surface,
        borderColor: theme.border,
      }}
    >
      <span style={{ ...text.eyebrow, color: theme.textMuted }}>Question {index + 1}</span>

      <h2 style={{ ...text.question, color: theme.text }}>{String(question.question)}</h2>

      <QuadraticVote.Diamond
        id={question.id}
        circleRadius={5}
        neutralColor={theme.diamondNeutral}
        positiveColor={theme.diamondPositive}
        negativeColor={theme.diamondNegative}
      />

      <p style={{ ...text.meta, color: theme.textMuted }}>
        {question.vote === 0 ? (
          'No votes cast'
        ) : (
          <>
            <strong style={{ color: theme.text }}>
              {question.vote > 0 ? '+' : ''}
              {question.vote}
            </strong>{' '}
            {Math.abs(question.vote) === 1 ? 'vote' : 'votes'} · {Math.abs(question.vote)}² = {cost}{' '}
            credits
          </>
        )}
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        <VoteButton
          label='Vote in favour'
          questionId={question.id}
          delta={1}
          cost={costOfPress(question.vote, 1)}
          hasVote={question.vote !== 0}
          onClick={() => vote(question.id, 1)}
          disabled={question.isDisabledUp}
          active={question.vote > 0}
          activeColor={theme.diamondPositive}
        >
          <ThumbsUpIcon size={20} />
        </VoteButton>
        <VoteButton
          label='Vote against'
          questionId={question.id}
          delta={-1}
          cost={costOfPress(question.vote, -1)}
          hasVote={question.vote !== 0}
          onClick={() => vote(question.id, -1)}
          disabled={question.isDisabledDown}
          active={question.vote < 0}
          activeColor={theme.diamondNegative}
        >
          <ThumbsDownIcon size={20} />
        </VoteButton>
      </div>
    </li>
  )
}

function Container() {
  const { questions, credits } = useQuadraticVote()
  const { theme } = useTheme()
  const isWide = useIsWide()
  const [device, setDevice] = useState<Device>('desktop')
  const [poolKind, setPoolKind] = useState<PoolKind>('grid')

  // Mobile and tablet have no room for the grid pool, so they always take the
  // liquid one. Desktop keeps whatever the toolbar last chose.
  const effectivePoolKind: PoolKind = device === 'desktop' ? poolKind : 'liquid'
  // The fixed rail only works when there is room beside the centred column.
  const useFixedRail = device === 'desktop' && isWide
  const frameWidth = DEVICES[device].width

  const rail = <PoolRail poolKind={effectivePoolKind} device={device} />

  return (
    <div style={{ ...layout.page, color: theme.text }}>
      {/* Desktop: a fixed rail, so the question column stays centred in the
          viewport. Otherwise stacked under the header, as part of the flow. */}
      {useFixedRail && <aside style={layout.fixedRail}>{rail}</aside>}

      <main
        style={{
          ...layout.main,
          // Narrow the page to the chosen device instead of resizing the window.
          maxWidth: frameWidth ?? layout.main.maxWidth,
        }}
      >
        <header style={layout.header}>
          <h1 style={{ ...text.title, color: theme.text }}>Quadratic Vote</h1>
          <p style={{ ...text.lead, color: theme.textMuted }}>
            You have <strong style={{ color: theme.text }}>{credits} credits</strong> to spend
            across {questions.length} questions. Each additional vote on the same question costs
            more than the last — <em>n</em> votes cost <em>n</em>² credits — so backing something
            strongly means giving up breadth.
          </p>
        </header>

        {!useFixedRail && (
          <div
            style={{
              ...layout.stackedRail,
              // Opaque, or the question cards scroll through it once it sticks.
              background: theme.background,
            }}
          >
            {rail}
          </div>
        )}

        <ol style={layout.list}>
          {questions.map((question, index) => (
            <QuestionCard key={question.id} question={question} index={index} />
          ))}
        </ol>
      </main>

      <Toolbar
        device={device}
        onDeviceChange={setDevice}
        poolKind={poolKind}
        onPoolKindChange={setPoolKind}
      />
    </div>
  )
}

/**
 * Icon-only vote control with its price underneath. The thumb direction carries
 * the meaning, so the label lives in `aria-label`/`title` rather than on screen —
 * but the cost is spelled out, because the whole point is that it was invisible.
 *
 * Hovering or focusing also previews the cost in the pool. Focus matters as much
 * as hover: a hover-only affordance is unusable by keyboard.
 */
function VoteButton({
  label,
  questionId,
  delta,
  cost,
  hasVote,
  onClick,
  disabled,
  active,
  activeColor,
  children,
}: {
  label: string
  questionId: string | number
  delta: number
  cost: number
  /** Whether the question has been voted on at all. */
  hasVote: boolean
  onClick: () => void
  disabled?: boolean
  active: boolean
  activeColor: string
  children: ReactNode
}) {
  const { theme } = useTheme()
  const { previewVote, clearPreview } = useQuadraticVote()
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  const background = active ? activeColor : hovered && !disabled ? theme.border : 'transparent'
  const spends = cost > 0
  const priceLabel = cost === 0 ? '—' : `${spends ? '−' : '+'}${Math.abs(cost)}`

  /**
   * Untouched, every question prices both buttons at one credit, so a column of
   * identical −1s says nothing and reads as clutter. The number earns its place
   * once a vote makes the two directions cost different amounts — and until
   * then it is still a hover or a focus away, which is also when the pool
   * highlights the credits it would move.
   */
  const showPrice = hasVote || hovered || focused

  const show = () => previewVote(questionId, delta)
  const hide = () => clearPreview()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button
        type='button'
        onClick={onClick}
        disabled={disabled}
        aria-label={`${label}, ${spends ? 'costs' : 'returns'} ${Math.abs(cost)} ${
          Math.abs(cost) === 1 ? 'credit' : 'credits'
        }`}
        aria-pressed={active}
        title={label}
        onMouseEnter={() => {
          setHovered(true)
          show()
        }}
        onMouseLeave={() => {
          setHovered(false)
          hide()
        }}
        onFocus={() => {
          setFocused(true)
          show()
        }}
        onBlur={() => {
          setFocused(false)
          hide()
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 52,
          height: 44,
          borderRadius: 12,
          border: `1px solid ${active ? activeColor : theme.border}`,
          background,
          color: active ? '#fff' : theme.textMuted,
          padding: 0,
          opacity: disabled ? 0.35 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background 150ms ease, border-color 150ms ease, color 150ms ease',
        }}
      >
        {children}
      </button>
      <span
        aria-hidden='true'
        style={{
          fontSize: 11,
          fontVariantNumeric: 'tabular-nums',
          color: disabled ? theme.border : spends ? theme.textMuted : theme.diamondPositive,
          // Held in place rather than unmounted, so revealing it on hover does
          // not shunt the row it sits in.
          opacity: showPrice ? 1 : 0,
          transition: 'opacity 140ms ease',
        }}
      >
        {priceLabel}
      </span>
    </div>
  )
}

const layout: Record<string, CSSProperties> = {
  page: {
    minHeight: '100vh',
    // Room for the floating toolbar at the bottom.
    padding: '64px 24px 160px',
    boxSizing: 'border-box',
  },
  fixedRail: {
    position: 'fixed',
    left: 40,
    top: '50%',
    transform: 'translateY(-50%)',
    zIndex: 10,
  },
  stackedRail: {
    // Sticks to the top of the viewport once scrolled past, so the pool stays
    // in view while answering — the credits are the thing you keep checking.
    position: 'sticky',
    top: 0,
    zIndex: 20,
    display: 'flex',
    justifyContent: 'center',
    padding: '12px 0 20px',
    marginBottom: 36,
  },
  main: {
    maxWidth: 680,
    margin: '0 auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: 56,
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    padding: '32px 32px 28px',
    borderRadius: 16,
    border: '1px solid',
    textAlign: 'center',
    transition: 'background 200ms ease, border-color 200ms ease',
  },
}

const text: Record<string, CSSProperties> = {
  title: {
    margin: 0,
    fontSize: 34,
    fontWeight: 600,
    letterSpacing: '-0.025em',
    lineHeight: 1.15,
  },
  lead: {
    margin: '16px auto 0',
    maxWidth: 560,
    fontSize: 15,
    lineHeight: 1.65,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.09em',
  },
  question: {
    margin: 0,
    maxWidth: 520,
    fontSize: 18,
    fontWeight: 500,
    lineHeight: 1.45,
    letterSpacing: '-0.01em',
  },
  meta: {
    margin: 0,
    fontSize: 13,
    lineHeight: 1.5,
  },
}

function App() {
  const questions: Question[] = [
    {
      question:
        'Should the city invest in a new public transportation system to reduce traffic congestion and improve sustainability?',
      vote: 0,
      id: 'one',
    },
    {
      question: 'Do you support increasing the minimum wage to $15 per hour?',
      vote: 0,
      id: 'two',
    },
    {
      question: 'Should the government allocate more funding to improve public schools?',
      vote: 0,
      id: 'three',
    },
    {
      question:
        'Do you believe stricter environmental regulations are necessary to combat climate change?',
      vote: 0,
      id: 'four',
    },
    {
      question:
        'Should the country adopt universal healthcare to provide healthcare coverage for all citizens?',
      vote: 0,
      id: 'five',
    },
    {
      question:
        'Do you agree with the proposed tax policy changes aimed at reducing income inequality?',
      vote: 0,
      id: 'six',
    },
  ]

  return (
    <ThemeProvider>
      <QuadraticVote.Provider credits={100} questions={questions}>
        <Container />
      </QuadraticVote.Provider>
    </ThemeProvider>
  )
}

export default App
