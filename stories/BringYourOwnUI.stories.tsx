import type { Meta, StoryObj } from '@storybook/react-vite'
import { CSSProperties, ReactNode } from 'react'
import { useQuadraticVote } from '../src/QuadraticVote'
import { Sandbox } from './harness'

/**
 * `Pool`, `LiquidPool` and `Diamond` are one way to draw a quadratic ballot,
 * not the way. Everything they use is on the context, so a completely different
 * visual language is a consumer-side component — no fork, no library change.
 *
 * The line the library draws: **it exports what is expensive to rebuild.** The
 * pools are animation, SVG filters and shared geometry that took real work to
 * get right. The bar mode below is arithmetic and CSS, and every application
 * would want to restyle it anyway. Shipping it would mean a vocabulary slot, a
 * colour slot and a layout slot — a component with fifteen props, harder to use
 * than the forty lines it replaces.
 *
 * So it lives here, as a worked example. Everything below is written in this
 * story file. Nothing in `src` knows bars exist.
 */
const meta: Meta = {
  title: 'Bring your own UI',
  parameters: { layout: 'fullscreen' },
}

export default meta
type Story = StoryObj

const HUES = ['#60a5fa', '#a78bfa', '#f472b6', '#fbbf24']

/* ------------------------------------------------------------------ *
 * The bar itself
 * ------------------------------------------------------------------ */

/** Pixels of thickness per vote. With length, this is what makes area ∝ vote². */
const UNIT_THICKNESS = 4.2

/**
 * One question's allocation as a diverging bar.
 *
 * It sits where `QuadraticVote.Diamond` sits and takes the same shape of props:
 * an `id` matching a question in the Provider, plus colours. It reads its own
 * vote from context, so a caller never threads state through it.
 *
 * Length *and* thickness both scale with the vote, so the ink grows as vote² —
 * the price. A plain bar chart draws a 3-vote answer as three times a 1-vote
 * answer when it costs nine times as much, which is the one thing a quadratic
 * ballot has to communicate.
 */
function Bar({
  id,
  positiveColor = '#16a34a',
  negativeColor = '#dc2626',
  maxVotes = 10,
  poles = ['', ''],
}: {
  id: string | number
  positiveColor?: string
  negativeColor?: string
  maxVotes?: number
  /** Axis words. A slot, not vocabulary — researchers name their own poles. */
  poles?: [string, string]
}) {
  const { questions } = useQuadraticVote()
  const vote = questions.find((q) => q.id === id)?.vote ?? 0

  const magnitude = Math.abs(vote)
  const positive = vote >= 0
  const color = positive ? positiveColor : negativeColor

  // Percentages of the track rather than measured pixels, so the bar reflows
  // with its container without a resize listener or a layout read.
  const length = `calc((50% - 14px) * ${magnitude / maxVotes})`
  const thickness = magnitude * UNIT_THICKNESS

  // Direction is otherwise carried only by which side of the axis the bar sits
  // on and by hue — and hue is the channel that fails for the most common
  // colour blindness. The taper and the signed number each survive without it.
  // Tip depth tracks thickness, or a one-credit bar would be all point.
  const tip = Math.min(11, Math.max(4, thickness * 0.9))
  const clipPath = positive
    ? `polygon(0 0, calc(100% - ${tip}px) 0, 100% 50%, calc(100% - ${tip}px) 100%, 0 100%)`
    : `polygon(100% 0, ${tip}px 0, 0 50%, ${tip}px 100%, 100% 100%)`

  return (
    <div style={bar.track}>
      <span style={{ ...bar.pole, left: 10 }}>{poles[0]}</span>
      <span style={{ ...bar.pole, right: 10 }}>{poles[1]}</span>
      <div style={bar.axis} />
      <div
        style={{
          ...bar.mark,
          width: length,
          height: thickness,
          opacity: vote === 0 ? 0 : 1,
          background: color,
          clipPath,
          ...(positive ? { left: '50%' } : { right: '50%' }),
        }}
      />
      {vote !== 0 && (
        <span
          style={{
            ...bar.value,
            color,
            ...(positive
              ? { left: `calc(50% + ${length} + 8px)` }
              : { right: `calc(50% + ${length} + 8px)` }),
          }}
        >
          {vote > 0 ? `+${vote}` : `−${magnitude}`}
        </span>
      )}
    </div>
  )
}

/**
 * Bar mode's replacement for `Pool`: the whole budget as one track, each
 * question's share laid end to end, the unspent remainder showing through as
 * hatching. `preview` draws the pending charge or refund where the credits
 * would actually move.
 */
function BudgetBar() {
  const { questions, credits, availableCredits, preview } = useQuadraticVote()
  const spent = credits - availableCredits

  // Prefix sum rather than an accumulator mutated inside map — the segments
  // sit end to end, so each one starts where everything before it finished.
  const shares = questions.map((question) => (question.vote ** 2 / credits) * 100)
  const segments = questions.map((question, index) => ({
    question,
    color: HUES[index % HUES.length],
    left: shares.slice(0, index).reduce((sum, share) => sum + share, 0),
    width: shares[index],
  }))

  const pending = preview && preview.affordable && preview.cost !== 0
  const pendingWidth = pending ? (Math.abs(preview.cost) / credits) * 100 : 0
  const pendingLeft = pending
    ? preview.cost > 0
      ? (spent / credits) * 100
      : (spent / credits) * 100 - pendingWidth
    : 0

  return (
    <div>
      <div style={bar.budgetHead}>
        <strong style={bar.budgetFigure}>
          {spent} <span style={bar.budgetUnit}>of {credits} credits spent</span>
        </strong>
        <span style={bar.budgetUnit}>{availableCredits} left</span>
      </div>

      <div style={bar.stack} aria-hidden='true'>
        {segments.map(({ question, color, left, width }) => (
          <div
            key={question.id}
            style={{ ...bar.seg, background: color, left: `${left}%`, width: `${width}%` }}
          />
        ))}
        {pending && (
          <div
            style={{
              ...bar.seg,
              left: `${pendingLeft}%`,
              width: `${pendingWidth}%`,
              boxShadow: 'none',
              borderRadius: 3,
              background:
                preview.cost > 0
                  ? 'repeating-linear-gradient(135deg, #2563eb 0 4px, transparent 4px 8px)'
                  : 'transparent',
              outline: preview.cost > 0 ? '1px solid #2563eb' : '2px dashed #16a34a',
              outlineOffset: preview.cost > 0 ? -1 : -2,
            }}
          />
        )}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Controls
 * ------------------------------------------------------------------ */

/**
 * Both controls priced at once.
 *
 * `preview` is driven by hover, so it can only describe one control at a time —
 * and on a touch device, none. `costOf(id, delta)` is the same calculation
 * without the state, so a row can label its up and its down control on every
 * render. A negative cost is a refund, so it reads in the respondent's favour.
 */
function Controls({ id }: { id: string | number }) {
  const { questions, vote, costOf, previewVote, clearPreview } = useQuadraticVote()
  const question = questions.find((q) => q.id === id)
  if (!question) return null

  return (
    <div style={bar.controls}>
      {[-1, 1].map((delta) => {
        const { cost } = costOf(id, delta)
        // Seeded from the first render, so nothing opens with every button
        // enabled and disables itself only once a vote has landed.
        const disabled = delta === 1 ? question.isDisabledUp : question.isDisabledDown
        const active = delta === 1 ? question.vote > 0 : question.vote < 0

        return (
          <div key={delta} style={bar.control}>
            <button
              type='button'
              disabled={disabled}
              onClick={() => vote(id, delta)}
              onMouseEnter={() => previewVote(id, delta)}
              onMouseLeave={clearPreview}
              onFocus={() => previewVote(id, delta)}
              onBlur={clearPreview}
              style={{
                ...bar.button,
                ...(active ? (delta === 1 ? bar.buttonUp : bar.buttonDown) : null),
                ...(disabled ? bar.buttonOff : null),
              }}
              aria-label={`Allocate ${delta === 1 ? 'a positive' : 'a negative'} credit to ${String(question.question)}`}
            >
              {delta === 1 ? '+' : '−'}
            </button>
            <span style={{ ...bar.price, color: cost < 0 ? '#16a34a' : '#6b7280' }}>
              {cost === 0 ? '—' : `${cost > 0 ? '−' : '+'}${Math.abs(cost)}`}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * The ballot around whichever indicator is being shown. The rows and the
 * controls are identical either way — swapping the drawing is the whole
 * difference between one mode and another.
 */
function Ballot({ indicator }: { indicator: (id: string | number) => ReactNode }) {
  const { questions } = useQuadraticVote()

  return (
    <ul style={bar.list}>
      {questions.map((question) => (
        <li key={question.id} style={bar.row}>
          <div style={bar.rowHead}>
            <p style={bar.rowTitle}>{String(question.question)}</p>
            <Controls id={question.id} />
          </div>
          {indicator(question.id)}
        </li>
      ))}
    </ul>
  )
}

/* ------------------------------------------------------------------ *
 * Radius: the same cost, encoded as area
 * ------------------------------------------------------------------ */

/** Radius of a maxed-out allocation, in px. */
const MAX_RADIUS = 34

/**
 * One question's allocation as a disc whose radius is the vote.
 *
 * Where the bar has to combine two channels to make the cost visible — length
 * *and* thickness, so the ink works out to vote² — a circle gets it for free.
 * Radius grows linearly with votes, so area grows as vote², which is exactly
 * what the allocation costs. Nothing has to be tuned to keep it honest.
 *
 * The tradeoff is comparison. Length is one of the easiest things to judge by
 * eye and area one of the hardest, so a respondent reads *this costs a lot*
 * more readily here and *this costs twice that* less readily. Worth it when the
 * ballot is about weighing one strong conviction against a spread of mild ones,
 * less so when the answers need ranking against each other.
 *
 * Direction rests on the signed number. A disc has no far end to point with, so
 * the bar's taper has no equivalent here, and the fill is left plain — which
 * makes the label the only cue that survives without colour rather than one of
 * two. A ballot that leans on this mode should keep it legible.
 *
 * The dashed ring is the cap, so the room left on a question is visible rather
 * than only discovered when a control greys out.
 */
function Radius({
  id,
  positiveColor = '#16a34a',
  negativeColor = '#dc2626',
  maxVotes = 10,
}: {
  id: string | number
  positiveColor?: string
  negativeColor?: string
  maxVotes?: number
}) {
  const { questions } = useQuadraticVote()
  const vote = questions.find((q) => q.id === id)?.vote ?? 0

  const magnitude = Math.abs(vote)
  const positive = vote >= 0
  const color = positive ? positiveColor : negativeColor
  const radius = (magnitude / maxVotes) * MAX_RADIUS

  const width = MAX_RADIUS * 2 + 60
  const height = MAX_RADIUS * 2 + 10
  const cx = MAX_RADIUS + 5
  const cy = height / 2

  return (
    <div style={bar.radiusCell}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden='true'>
        <circle
          cx={cx}
          cy={cy}
          r={MAX_RADIUS}
          fill='none'
          stroke='#d1d5db'
          strokeWidth='1'
          strokeDasharray='3 4'
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill={color}
          style={{ transition: 'r 320ms cubic-bezier(0.22, 1, 0.36, 1)' }}
        />

        {vote !== 0 && (
          <text
            x={MAX_RADIUS * 2 + 16}
            y={cy}
            dominantBaseline='middle'
            fill={color}
            fontSize='13'
            fontWeight='600'
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {vote > 0 ? `+${vote}` : `−${magnitude}`}
          </text>
        )}
      </svg>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Stories
 * ------------------------------------------------------------------ */

/**
 * A complete ballot with no library UI in it at all. Hover a control and the
 * budget bar shows the pending charge — a dashed outline when the press would
 * hand credits back.
 *
 * The three pieces of context it needs: `questions` for the votes and the
 * disabled flags, `credits` / `availableCredits` for the budget, and
 * `costOf` / `preview` for the price of a press.
 */
export const Bars: Story = {
  render: () => (
    <Sandbox credits={100}>
      <div style={bar.page}>
        <BudgetBar />
        <Ballot indicator={(id) => <Bar id={id} />} />
      </div>
    </Sandbox>
  ),
}

/**
 * The same ballot, the same context, the allocation drawn as area instead of
 * length.
 *
 * Only the indicator changes — the rows, the controls and the budget bar are
 * the ones from the story above. That is the point of reading state off the
 * context rather than owning it: a mode is a component, not a fork.
 */
export const Radii: Story = {
  render: () => (
    <Sandbox credits={100}>
      <div style={bar.page}>
        <BudgetBar />
        <Ballot indicator={(id) => <Radius id={id} />} />
      </div>
    </Sandbox>
  ),
}

/* ------------------------------------------------------------------ *
 * Styles — story-local, so nothing here implies a shipped theme.
 * ------------------------------------------------------------------ */

const bar: Record<string, CSSProperties> = {
  page: { display: 'flex', flexDirection: 'column', gap: 20, padding: 24, maxWidth: 720 },

  budgetHead: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  budgetFigure: { fontSize: 20, fontWeight: 600 },
  budgetUnit: { fontSize: 13, fontWeight: 400, color: '#6b7280' },
  stack: {
    position: 'relative',
    height: 24,
    borderRadius: 6,
    overflow: 'hidden',
    background:
      'repeating-linear-gradient(135deg, transparent, transparent 5px, #e5e7eb 5px, #e5e7eb 6px), #eef1f6',
  },
  // Laid end to end as exact percentages of the whole track. An earlier version
  // flexed a "remaining" item against them; the gaps came out of the segments,
  // and at a full budget the remainder won the entire bar while every segment
  // collapsed to nothing — the bar read as empty exactly when it was full.
  seg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1), left 320ms cubic-bezier(0.22, 1, 0.36, 1)',
    boxShadow: '1px 0 0 #fff',
  },

  list: { display: 'flex', flexDirection: 'column', gap: 10, margin: 0, padding: 0, listStyle: 'none' },
  row: {
    padding: '14px 18px',
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 14,
  },
  rowHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 18,
    marginBottom: 12,
  },
  rowTitle: { fontSize: 14, fontWeight: 500, margin: 0 },

  track: {
    position: 'relative',
    height: 52,
    background: '#eef1f6',
    borderRadius: 8,
    overflow: 'hidden',
  },
  axis: { position: 'absolute', left: '50%', top: 6, bottom: 6, width: 1, background: '#d1d5db' },
  mark: {
    position: 'absolute',
    top: '50%',
    borderRadius: 3,
    transform: 'translateY(-50%)',
    transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1), height 320ms cubic-bezier(0.22, 1, 0.36, 1)',
  },
  pole: {
    position: 'absolute',
    top: 5,
    fontSize: 10,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#9ca3af',
  },
  value: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 12,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    transition: 'opacity 200ms ease',
    pointerEvents: 'none',
  },

  controls: { display: 'flex', gap: 10, flexShrink: 0 },
  control: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  button: {
    width: 44,
    height: 36,
    borderRadius: 10,
    border: '1px solid #e5e7eb',
    background: 'transparent',
    color: '#6b7280',
    font: 'inherit',
    fontSize: 17,
    lineHeight: 1,
    cursor: 'pointer',
  },
  buttonUp: { background: '#16a34a', borderColor: '#16a34a', color: '#fff' },
  buttonDown: { background: '#dc2626', borderColor: '#dc2626', color: '#fff' },
  buttonOff: { opacity: 0.35, cursor: 'not-allowed' },
  price: { fontSize: 11, fontVariantNumeric: 'tabular-nums' },

  radiusCell: { display: 'flex', justifyContent: 'center', padding: '4px 0' },
}
