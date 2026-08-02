<p align="center">
  <a href="https://github.com/civicbase" rel="noopener" target="_blank"><img width="350"  src="https://firebasestorage.googleapis.com/v0/b/civic-base.appspot.com/o/logos%2Fcivicbase_gradient_logo.svg?alt=media&token=a7036197-1c83-4585-a107-5f70d0c91333&_gl=1*1oktzd7*_ga*MTU2NTE1MTg2OS4xNjk4NDg2MTEy*_ga_CW55HF8NVT*MTY5OTI0ODEwMC4zLjEuMTY5OTI0ODI2NC4zMi4wLjA." alt="Civicbase Logo"></a>
</p>

<h1 align="center">Quadratic-Vote</h1>

<div align="center">

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/civicbase/quadratic-vote/blob/main/LICENSE)
[![npm latest package](https://img.shields.io/npm/v/quadratic-vote/latest.svg)](https://www.npmjs.com/package/quadratic-vote)
[![npm downloads](https://img.shields.io/npm/dm/quadratic-vote.svg)](https://www.npmjs.com/package/quadratic-vote)
[![bundle size](https://img.shields.io/bundlephobia/minzip/quadratic-vote)](https://bundlephobia.com/package/quadratic-vote)

</div>

React components for quadratic voting. Respondents spend **credits** to buy
**votes**, and each extra vote on the same question costs more than the last, so
a strong opinion has to be paid for out of a fixed budget.

| Votes on one question | Credits spent |
| --------------------- | ------------- |
| 1                     | 1             |
| 2                     | 4             |
| 3                     | 9             |
| 5                     | 25            |
| 10                    | 100           |

The cost is `vote²`. Negative votes cost the same as positive ones.

- No runtime dependencies. React and React DOM are peer dependencies.
- TypeScript types included.
- Colours, sizes and layout are props.
- Credits animate between the pool and the per-question indicators.

## Installation

```bash
npm install quadratic-vote
```

`yarn add quadratic-vote` and `pnpm add quadratic-vote` work the same way.

## Quick start

Everything hangs off one provider. It owns the votes, enforces the budget, and
drives the animations.

```tsx
import QuadraticVote, { Question, useQuadraticVote } from 'quadratic-vote'

const questions: Question[] = [
  { id: 'features', question: 'Should we implement feature X?', vote: 0 },
  { id: 'performance', question: 'Should we prioritize performance?', vote: 0 },
]

function Ballot() {
  const { questions, vote, reset } = useQuadraticVote()

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <QuadraticVote.Pool creditColor='#D1D5DB' circleColor='#3B82F6' />

      {questions.map((q) => (
        <div key={q.id}>
          <p>{q.question}</p>
          <QuadraticVote.Diamond
            id={q.id}
            neutralColor='#9CA3AF'
            positiveColor='#22C55E'
            negativeColor='#EF4444'
          />
          <button onClick={() => vote(q.id, 1)} disabled={q.isDisabledUp}>
            Vote up
          </button>
          <button onClick={() => vote(q.id, -1)} disabled={q.isDisabledDown}>
            Vote down
          </button>
        </div>
      ))}

      <button onClick={reset}>Reset</button>
    </div>
  )
}

export default function App() {
  return (
    <QuadraticVote.Provider credits={100} questions={questions}>
      <Ballot />
    </QuadraticVote.Provider>
  )
}
```

Every component is also a named export, if you would rather not use the
namespace:

```tsx
import { QuadraticVoteProvider, Pool, Diamond, useQuadraticVote } from 'quadratic-vote'
```

## API reference

### `<QuadraticVote.Provider>`

Wraps your voting interface and holds the state.

| Prop          | Type          | Required | Description                                  |
| ------------- | ------------- | -------- | -------------------------------------------- |
| `credits`     | `number`      | yes      | Total voting credits. Must be between 4 and 225 |
| `questions`   | `Question[]`  | yes      | The questions to vote on                     |
| `children`    | `ReactNode`   | yes      | Your voting interface                        |
| `returnOrder` | `ReturnOrder` |          | Refill order, default `'first-out-last-in'`  |

The provider seeds its state from `questions` once, when it mounts. To change the
ballot afterwards, remount it with a `key`. `credits` is read live, so raising or
lowering the budget takes effect without a remount.

#### `returnOrder`

The order pool circles refill in when credits come back from a diamond.

- `'first-out-last-in'` (default) — the circle that emptied first is the last to
  refill, so credits retrace their steps. The pool behaves like a stack.
- `'first-out-first-in'` — the circle that emptied first refills first, so the
  block refills in the direction it drained.

```tsx
<QuadraticVote.Provider credits={100} questions={questions} returnOrder='first-out-first-in'>
  {/* ... */}
</QuadraticVote.Provider>
```

### Showing what a vote costs

The price of the next vote is the thing respondents cannot see. At 3 votes the
next one costs 7, at 0 votes it costs 1, and the button looks the same either
way.

`costOf(id, delta)` returns the price without casting the vote, so a control can
show what it will charge:

```tsx
const { costOf, vote } = useQuadraticVote()

// both controls priced at once; a negative cost is a refund
{[-1, 1].map((delta) => {
  const { cost, affordable } = costOf(q.id, delta)
  return (
    <button key={delta} disabled={!affordable} onClick={() => vote(q.id, delta)}>
      {delta === 1 ? '+' : '−'} {cost > 0 ? `−${cost}` : `+${-cost}`}
    </button>
  )
})}
```

`previewVote(id, delta)` does the same calculation and also stores it in
`preview`, which makes `<Pool>` paint the credits the vote would move in
`previewColor` — the next free ones for a spend, the last spent ones for a
refund. Use it for hover; clear it with `clearPreview`. Casting a vote clears it
for you.

```tsx
const { previewVote, clearPreview, preview } = useQuadraticVote()

<button
  onMouseEnter={() => previewVote(q.id, 1)}
  onMouseLeave={clearPreview}
  onFocus={() => previewVote(q.id, 1)}   // hover alone is unusable by keyboard
  onBlur={clearPreview}
  onClick={() => vote(q.id, 1)}
>
  Vote up {preview ? `(${preview.cost})` : null}
</button>
```

Both return a `VotePreview`:

| Field        | Type               | Description                                 |
| ------------ | ------------------ | ------------------------------------------- |
| `id`         | `string \| number` | Question it refers to                       |
| `delta`      | `number`           | Delta being priced, usually `+1`/`-1`       |
| `nextVote`   | `number`           | Vote the question would land on             |
| `cost`       | `number`           | Credits consumed, or returned when negative |
| `affordable` | `boolean`          | Whether the budget allows it                |
| `shortfall`  | `number`           | Credits missing when unaffordable, else `0` |

> **`cost` is not `2n + 1`.** That only holds while a vote moves _away_ from
> zero. Pressing "up" on a question sitting at `-3` moves it to `-2` and hands
> **5 credits back**, so `cost` is negative there. Label your buttons from
> `cost`, not from a formula, or half of them will be wrong.

### `<QuadraticVote.Pool>`

The credit budget as a grid of circles, filled as credits are spent.

| Prop            | Type      | Default     | Description                           |
| --------------- | --------- | ----------- | ------------------------------------- |
| `columns`       | `number`  | `5`         | Columns in the pool grid              |
| `circleRadius`  | `number`  | `4`         | Radius of each credit circle          |
| `circleSpacing` | `number`  | `4`         | Spacing between circles               |
| `reverse`       | `boolean` | `false`     | Reverse the fill direction            |
| `creditColor`   | `string`  | `'black'`   | Colour of used credits                |
| `circleColor`   | `string`  | `'grey'`    | Colour of available credits           |
| `previewColor`  | `string`  | `'#F59E0B'` | Colour of credits a preview would move |

### `<QuadraticVote.LiquidPool>`

A compact alternative to `<Pool>`, meant for mobile: the budget as a floating
drop of water with satellite droplets orbiting it. The droplets shrink and
disappear one by one as credits are spent, and the whole thing dries out at zero.

```tsx
<QuadraticVote.LiquidPool size={140} inkColor='#38BDF8' droplets={7} />
```

| Prop           | Type     | Default     | Description                                           |
| -------------- | -------- | ----------- | ----------------------------------------------------- |
| `size`         | `number` | `120`       | Reserved layout footprint (px). Liquid may exceed it. |
| `inkColor`     | `string` | `'#ffffff'` | Colour of the liquid                                  |
| `droplets`     | `number` | `6`         | Satellite droplets at full credits                    |
| `spread`       | `number` | `0.42`      | How far droplets orbit past the blob, × `size`        |
| `wobble`       | `number` | `0.55`      | Outline irregularity: `0` round, `1` very lumpy       |
| `driftSeconds` | `number` | `14`        | Seconds per drift cycle. Higher is slower             |
| `viscosity`    | `number` | `0.16`      | How readily liquid fuses, × the blob radius           |
| `settleMs`     | `number` | `900`       | How slowly the pool drains and refills                |

`size` reserves a square footprint for layout; the liquid drifts outside it.

Droplets range from 15% to 35% of the main blob. Raising `viscosity` much higher
dissolves them, because the goo threshold erases any shape smaller than the blur.

<details>
<summary>How it is drawn</summary>

The blobs are plain SVG circles fused by a gooey filter: `feGaussianBlur` smears
neighbouring shapes together and `feColorMatrix` pushes the blurred alpha back to
a hard edge. That works on the alpha channel, so it needs no opaque backdrop, and
the filter region extends past the component box, so droplets are never clipped.

A credit flying to or from the pool changes hands at the liquid's edge. Outside
it, it is a plain credit in its own colour. Inside, the pool draws it as a shape
within the gooey filter, so it stretches toward the blob and merges rather than
sitting on top as a crisp circle. A credit coming home is also kept out of the
balance until it lands, so a new droplet forms _around_ the arriving credit
instead of appearing the moment the vote is cast.

Motion runs on one animation frame loop that writes SVG attributes directly, so a
frame costs no React render. It idles while the tab is hidden and freezes for
`prefers-reduced-motion`.

</details>

### `<QuadraticVote.Diamond>`

A per-question indicator that grows as votes are allocated.

| Prop            | Type               | Default     | Description                              |
| --------------- | ------------------ | ----------- | ---------------------------------------- |
| `id`            | `string \| number` | required    | Must match a question in the Provider    |
| `neutralColor`  | `string`           | `'#A9A9A9'` | Colour when no vote is cast              |
| `positiveColor` | `string`           | `'#00FF00'` | Colour for positive votes                |
| `negativeColor` | `string`           | `'#FF0000'` | Colour for negative votes                |
| `circleRadius`  | `number`           | `4`         | Radius of the diamond's circles          |

### `useQuadraticVote()`

Reads and writes the vote state. Must be called inside a Provider.

```tsx
const {
  questions, // Current votes, plus isDisabledUp / isDisabledDown
  credits, // Total budget
  availableCredits, // What is left
  vote, // Cast a vote: (id, delta) => void
  reset, // Set every vote back to zero: () => void

  costOf, // Price a vote without casting it: (id, delta) => VotePreview
  preview, // VotePreview | null — what previewVote last described
  previewVote, // Price a vote and highlight it in Pool: (id, delta) => void
  clearPreview, // Drop the current preview: () => void
} = useQuadraticVote()
```

`vote()` takes a delta, not a target: `vote(id, 1)` adds a vote, `vote(id, -1)`
removes one. A vote that would go over budget is ignored, so drive your buttons
off `isDisabledUp` and `isDisabledDown` rather than calling and hoping.

See [Showing what a vote costs](#showing-what-a-vote-costs) for the last four.

### `Question`

`id` and `vote` are the only fields the library uses. Anything else you add is
carried through untouched, which is where the question text usually lives.

```tsx
interface Question {
  id: string | number
  vote: number
  isDisabledUp?: boolean
  isDisabledDown?: boolean
  [key: string]: any
}
```

## Customization

Colours and sizes are props:

```tsx
<QuadraticVote.Pool
  columns={10}
  circleRadius={6}
  circleSpacing={6}
  creditColor='#EF4444'
  circleColor='#10B981'
/>

<QuadraticVote.Diamond
  id='features'
  neutralColor='#6B7280'
  positiveColor='#3B82F6'
  negativeColor='#F59E0B'
/>
```

Nothing in the library detects viewport size. Choosing `Pool` on desktop and
`LiquidPool` on mobile is your app's decision.

## Animation

Credits fly from the pool to a diamond when a vote goes up, and back when it goes
down. Flights are staggered so several credits move in sequence rather than all
at once, they follow the page as it scrolls, and their colour changes in step
with the flight.

The Provider mounts the overlay and dispatches the events. The pools and diamonds
coordinate through `qv:*` window events and `data-*` attributes on the rendered
SVG, so rendering more than one pool at a time will make them compete for the same
flying credits.

## Accessibility

The pools and diamonds are decorative SVG — they show the state, they do not
announce it. The controls are yours, so labelling them is too. Give each button
an accessible name, drive its disabled state from `isDisabledUp` and
`isDisabledDown`, and use `onFocus` alongside `onMouseEnter` if you show prices on
hover, since hover alone is unreachable by keyboard.

## Storybook

Every component has interactive documentation with live prop controls, plus
layout recipes and a worked example of building your own interface on the hook.

```bash
npm run storybook             # Dev server on http://localhost:6006
npm run build-storybook       # Static build in storybook-static/
npm run type-check:storybook  # Type-check stories only
```

Stories live in `/stories` and import from `src` directly, so the documentation
matches the working tree. They never ship: `package.json#files` limits the
published tarball to `dist`, and neither the library build nor `npm run
type-check` sees them.

## Development

```bash
npm run dev       # Demo app
npm run build     # Build the package
npm test          # Run tests
npm run coverage  # Coverage report
```

Tests use Vitest and React Testing Library.

## Examples

- [Live demo on CodeSandbox](https://codesandbox.io/s/quadratic-vote-nyk9nx)
- The `/demo` directory, for a complete implementation

## Contributing

See the [contributing guidelines](CONTRIBUTING.md) before opening a pull request.

## License

MIT © [Civicbase](https://github.com/civicbase)

## Links

- [NPM package](https://www.npmjs.com/package/quadratic-vote)
- [GitHub repository](https://github.com/civicbase/quadratic-vote)
- [Issue tracker](https://github.com/civicbase/quadratic-vote/issues)
- [Quadratic voting explained](https://en.wikipedia.org/wiki/Quadratic_voting)
