import { CSSProperties, ReactNode, useEffect, useState } from 'react'
import QuadraticVote, { Question, useQuadraticVote } from '../src/QuadraticVote'
import { ThumbsDownIcon, ThumbsUpIcon } from './icons'
import Toolbar, { PoolKind } from './Toolbar'
import { ThemeProvider, useTheme } from './theme'

/**
 * Above this width the pool sits in a fixed rail on the left, so the question
 * column stays centred in the viewport rather than being pushed sideways by it.
 * Below it, the pool stacks above the questions.
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

function PoolRail({ poolKind }: { poolKind: PoolKind }) {
  const { theme } = useTheme()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <span style={{ ...text.eyebrow, color: theme.textMuted }}>Credits</span>

      {/* Only one pool is ever mounted — two would compete for the same flying credits. */}
      {poolKind === 'grid' ? (
        <QuadraticVote.Pool
          columns={10}
          circleRadius={5}
          circleSpacing={5}
          creditColor={theme.poolCredit}
          circleColor={theme.poolCircle}
        />
      ) : (
        <QuadraticVote.LiquidPool size={140} inkColor={theme.liquidInk} droplets={7} />
      )}
    </div>
  )
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
          onClick={() => vote(question.id, 1)}
          disabled={question.isDisabledUp}
          active={question.vote > 0}
          activeColor={theme.diamondPositive}
        >
          <ThumbsUpIcon size={20} />
        </VoteButton>
        <VoteButton
          label='Vote against'
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
  const [poolKind, setPoolKind] = useState<PoolKind>('grid')

  const rail = <PoolRail poolKind={poolKind} />

  return (
    <div style={{ ...layout.page, color: theme.text }}>
      {/* Wide: a fixed rail, so the question column stays centred in the viewport.
          Narrow: stacked under the header, where it reads as part of the flow. */}
      {isWide && <aside style={layout.fixedRail}>{rail}</aside>}

      <main style={layout.main}>
        <header style={layout.header}>
          <h1 style={{ ...text.title, color: theme.text }}>Quadratic Vote</h1>
          <p style={{ ...text.lead, color: theme.textMuted }}>
            You have <strong style={{ color: theme.text }}>{credits} credits</strong> to spend
            across {questions.length} questions. Each additional vote on the same question costs
            more than the last — <em>n</em> votes cost <em>n</em>² credits — so backing something
            strongly means giving up breadth.
          </p>
        </header>

        {!isWide && <div style={layout.stackedRail}>{rail}</div>}

        <ol style={layout.list}>
          {questions.map((question, index) => (
            <QuestionCard key={question.id} question={question} index={index} />
          ))}
        </ol>
      </main>

      <Toolbar poolKind={poolKind} onPoolKindChange={setPoolKind} />
    </div>
  )
}

/**
 * Icon-only vote control. The thumb direction carries the meaning, so the label
 * lives in `aria-label`/`title` rather than on screen.
 */
function VoteButton({
  label,
  onClick,
  disabled,
  active,
  activeColor,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  active: boolean
  activeColor: string
  children: ReactNode
}) {
  const { theme } = useTheme()
  const [hovered, setHovered] = useState(false)

  const background = active ? activeColor : hovered && !disabled ? theme.border : 'transparent'

  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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
    display: 'flex',
    justifyContent: 'center',
    marginBottom: 56,
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
