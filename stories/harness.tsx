import { ReactNode } from 'react'
import QuadraticVote, { Question, ReturnOrder, useQuadraticVote } from '../src/QuadraticVote'

/**
 * Shared scaffolding for the stories. None of this ships — it exists so every
 * story can show a component doing real work instead of a static screenshot.
 */

export const sampleQuestions: Question[] = [
  { id: 'transit', question: 'Expand the light rail network to the east side', vote: 0 },
  { id: 'housing', question: 'Rezone downtown for mixed-income housing', vote: 0 },
  { id: 'parks', question: 'Convert the riverfront parking lot into a park', vote: 0 },
  { id: 'schools', question: 'Fund after-school programs in every district', vote: 0 },
]

export const shortQuestions: Question[] = [
  { id: 'a', question: 'Proposal A', vote: 0 },
  { id: 'b', question: 'Proposal B', vote: 0 },
]

/** Every story remounts the Provider when `credits` changes, because the
 *  Provider seeds its state once and does not re-read the prop afterwards. */
export function Sandbox({
  credits = 100,
  questions = sampleQuestions,
  returnOrder,
  children,
}: {
  credits?: number
  questions?: Question[]
  returnOrder?: ReturnOrder
  children: ReactNode
}) {
  return (
    <QuadraticVote.Provider
      key={`${credits}-${returnOrder ?? 'default'}`}
      credits={credits}
      questions={questions}
      returnOrder={returnOrder}
    >
      <div style={styles.sandbox}>{children}</div>
    </QuadraticVote.Provider>
  )
}

/** Live readout of the credit maths, useful next to any pool variant. */
export function CreditsReadout() {
  const { credits, availableCredits, questions, reset } = useQuadraticVote()
  const spent = credits - availableCredits

  return (
    <div style={styles.readout}>
      <dl style={styles.readoutList}>
        <Stat label='Total' value={credits} />
        <Stat label='Spent' value={spent} />
        <Stat label='Available' value={availableCredits} />
      </dl>
      <code style={styles.formula}>
        {questions
          .filter((q) => q.vote !== 0)
          .map((q) => `${Math.abs(q.vote)}²`)
          .join(' + ') || '0'}{' '}
        = {spent}
      </code>
      <button type='button' style={styles.ghostButton} onClick={reset}>
        Reset
      </button>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={styles.stat}>
      <dt style={styles.statLabel}>{label}</dt>
      <dd style={styles.statValue}>{value}</dd>
    </div>
  )
}

/**
 * One votable row: the question text, -/+ buttons wired to `vote()`, and
 * optionally the Diamond indicator.
 */
export function QuestionRow({
  question,
  layout = 'row',
  children,
}: {
  question: Question
  /** `stacked` puts the text above the indicator — necessary in narrow columns. */
  layout?: 'row' | 'stacked'
  children?: ReactNode
}) {
  const { vote } = useQuadraticVote()

  if (layout === 'stacked') {
    return (
      <li style={{ ...styles.row, flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
        <div style={styles.rowText}>
          <p style={styles.rowQuestion}>{String(question.question)}</p>
          <span style={styles.rowCost}>
            {question.vote} vote{Math.abs(question.vote) === 1 ? '' : 's'} · {question.vote ** 2}{' '}
            credits
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {children}
          <div style={styles.rowButtons}>
            <button
              type='button'
              style={styles.voteButton}
              disabled={question.isDisabledDown}
              onClick={() => vote(question.id, -1)}
            >
              −
            </button>
            <span style={styles.voteCount}>{question.vote}</span>
            <button
              type='button'
              style={styles.voteButton}
              disabled={question.isDisabledUp}
              onClick={() => vote(question.id, 1)}
            >
              +
            </button>
          </div>
        </div>
      </li>
    )
  }

  return (
    <li style={styles.row}>
      <div style={styles.rowText}>
        <p style={styles.rowQuestion}>{String(question.question)}</p>
        <span style={styles.rowCost}>
          {question.vote} vote{Math.abs(question.vote) === 1 ? '' : 's'} · {question.vote ** 2}{' '}
          credits
        </span>
      </div>

      {children}

      <div style={styles.rowButtons}>
        <button
          type='button'
          style={styles.voteButton}
          disabled={question.isDisabledDown}
          onClick={() => vote(question.id, -1)}
        >
          −
        </button>
        <span style={styles.voteCount}>{question.vote}</span>
        <button
          type='button'
          style={styles.voteButton}
          disabled={question.isDisabledUp}
          onClick={() => vote(question.id, 1)}
        >
          +
        </button>
      </div>
    </li>
  )
}

/** The full ballot: every question with its Diamond. */
export function Ballot({
  diamondProps,
  layout = 'row',
}: {
  diamondProps?: Record<string, unknown>
  layout?: 'row' | 'stacked'
}) {
  const { questions } = useQuadraticVote()

  return (
    <ul style={styles.list}>
      {questions.map((question) => (
        <QuestionRow key={question.id} question={question} layout={layout}>
          <QuadraticVote.Diamond id={question.id} {...diamondProps} />
        </QuestionRow>
      ))}
    </ul>
  )
}

/** Ballot without indicators — for stories that document a pool in isolation. */
export function PlainBallot() {
  const { questions } = useQuadraticVote()

  return (
    <ul style={styles.list}>
      {questions.map((question) => (
        <QuestionRow key={question.id} question={question} />
      ))}
    </ul>
  )
}

export function Panel({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section style={styles.panel}>
      {title ? <h3 style={styles.panelTitle}>{title}</h3> : null}
      {children}
    </section>
  )
}

export const styles: Record<string, React.CSSProperties> = {
  sandbox: {
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#111827',
  },
  panel: {
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    padding: 16,
    background: '#fff',
  },
  panelTitle: {
    margin: '0 0 12px',
    fontSize: 13,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#6B7280',
  },
  readout: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 12,
  },
  readoutList: {
    display: 'flex',
    gap: 16,
    margin: 0,
  },
  stat: { margin: 0 },
  statLabel: {
    margin: 0,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#6B7280',
  },
  statValue: {
    margin: 0,
    fontSize: 20,
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  formula: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '12px 16px',
    border: '1px solid #E5E7EB',
    borderRadius: 12,
    background: '#fff',
  },
  rowText: { flex: 1, minWidth: 0 },
  rowQuestion: { margin: 0, fontSize: 14, fontWeight: 500 },
  rowCost: { fontSize: 12, color: '#6B7280' },
  rowButtons: { display: 'flex', alignItems: 'center', gap: 8 },
  voteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    background: '#fff',
    fontSize: 16,
    lineHeight: 1,
    cursor: 'pointer',
  },
  voteCount: {
    minWidth: 24,
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 600,
  },
  ghostButton: {
    alignSelf: 'flex-start',
    padding: '6px 12px',
    borderRadius: 8,
    border: '1px solid #D1D5DB',
    background: '#fff',
    fontSize: 12,
    cursor: 'pointer',
  },
}
