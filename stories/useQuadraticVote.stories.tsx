import type { Meta, StoryObj } from '@storybook/react-vite'
import { useQuadraticVote } from '../src/QuadraticVote'
import { Panel, Sandbox, sampleQuestions, styles } from './harness'

/**
 * `useQuadraticVote()` is the whole API surface for reading and writing votes.
 * It must be called inside a `QuadraticVote.Provider`.
 *
 * ```ts
 * const {
 *   questions,        // Question[] — current votes plus isDisabledUp / isDisabledDown
 *   credits,          // number — the total budget
 *   availableCredits, // number — what is left
 *   vote,             // (id, delta) => void
 *   reset,            // () => void
 *
 *   costOf,           // (id, delta) => VotePreview — the price, without casting
 *   preview,          // VotePreview | null — what previewVote last described
 *   previewVote,      // (id, delta) => void — set preview, and highlight in Pool
 *   clearPreview,     // () => void
 * } = useQuadraticVote()
 * ```
 *
 * `vote()` takes a **delta**, not a target: `vote(id, 1)` adds a vote, `vote(id, -1)`
 * removes one. A call that would exceed the budget is silently ignored, which is why
 * you should drive your buttons off `isDisabledUp` / `isDisabledDown` rather than
 * calling and hoping.
 *
 * The bottom four are about price. `previewVote` is for hover: it sets `preview` and
 * makes `Pool` highlight the credits that would move. `costOf` is the same
 * calculation with no state behind it, so a control can show its own price on every
 * render — which is what you need to label an up and a down control at the same
 * time, or to show a price at all on a touch device.
 */
type Args = { credits: number }

const meta: Meta<Args> = {
  title: 'Hooks/useQuadraticVote',
  parameters: { layout: 'padded' },
  argTypes: {
    credits: { control: { type: 'range', min: 4, max: 225, step: 1 } },
  },
  args: { credits: 100 },
}

export default meta
type Story = StoryObj<Args>

function StateInspector() {
  const { questions, credits, availableCredits, vote, reset } = useQuadraticVote()

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {questions.map((q) => (
          <div key={q.id} style={styles.row}>
            <div style={styles.rowText}>
              <p style={styles.rowQuestion}>{String(q.question)}</p>
              <span style={styles.rowCost}>
                id: <code>{String(q.id)}</code>
              </span>
            </div>
            <div style={styles.rowButtons}>
              <button
                type='button'
                style={styles.voteButton}
                disabled={q.isDisabledDown}
                onClick={() => vote(q.id, -1)}
              >
                −
              </button>
              <span style={styles.voteCount}>{q.vote}</span>
              <button
                type='button'
                style={styles.voteButton}
                disabled={q.isDisabledUp}
                onClick={() => vote(q.id, 1)}
              >
                +
              </button>
            </div>
          </div>
        ))}
        <button type='button' style={styles.ghostButton} onClick={reset}>
          reset()
        </button>
      </div>

      <Panel title='Hook state'>
        <pre style={inspectorStyles.pre}>
          {JSON.stringify({ credits, availableCredits, questions }, null, 2)}
        </pre>
      </Panel>
    </div>
  )
}

/**
 * Every field the hook exposes, live. Note how `isDisabledUp` flips to `true`
 * across *all* questions once the remaining budget can no longer afford the next vote.
 */
export const StateAndActions: Story = {
  render: ({ credits }) => (
    <Sandbox credits={credits} questions={sampleQuestions}>
      <StateInspector />
    </Sandbox>
  ),
}

function HeadlessBallot() {
  const { questions, credits, availableCredits, vote } = useQuadraticVote()
  const spent = credits - availableCredits

  return (
    <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={inspectorStyles.barTrack}>
          <div style={{ ...inspectorStyles.barFill, width: `${(spent / credits) * 100}%` }} />
        </div>
        <span style={styles.rowCost}>
          {availableCredits} of {credits} credits left
        </span>
      </div>

      {questions.map((q) => {
        const magnitude = Math.abs(q.vote)
        return (
          <div key={q.id} style={styles.row}>
            <div style={styles.rowText}>
              <p style={styles.rowQuestion}>{String(q.question)}</p>
              <span style={styles.rowCost}>
                {q.vote > 0 ? '▲' : q.vote < 0 ? '▼' : '—'} {magnitude} × {magnitude} ={' '}
                {q.vote ** 2} credits
              </span>
            </div>
            <div style={styles.rowButtons}>
              <button
                type='button'
                style={styles.voteButton}
                disabled={q.isDisabledDown}
                onClick={() => vote(q.id, -1)}
              >
                −
              </button>
              <span style={styles.voteCount}>{q.vote}</span>
              <button
                type='button'
                style={styles.voteButton}
                disabled={q.isDisabledUp}
                onClick={() => vote(q.id, 1)}
              >
                +
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * You are not obliged to use `Pool` or `Diamond` at all. The hook alone is enough
 * to build a completely custom interface — here a progress bar and plain text —
 * while the Provider still enforces the quadratic budget.
 */
export const HeadlessUsage: Story = {
  render: ({ credits }) => (
    <Sandbox credits={credits} questions={sampleQuestions}>
      <HeadlessBallot />
    </Sandbox>
  ),
}

const inspectorStyles: Record<string, React.CSSProperties> = {
  pre: {
    margin: 0,
    fontSize: 11,
    lineHeight: 1.5,
    maxHeight: 420,
    overflow: 'auto',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  },
  barTrack: {
    height: 8,
    borderRadius: 999,
    background: '#E5E7EB',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    background: '#2563EB',
    transition: 'width 200ms ease',
  },
}
