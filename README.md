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

**Quadratic-Vote** is a modern React component library for implementing quadratic voting in web applications with smooth animations. Quadratic voting allows participants to allocate votes to express the intensity of their preferences, with the cost increasing quadratically (1 vote = 1 credit, 2 votes = 4 credits, 3 votes = 9 credits, etc.).

## ✨ Features

- 🎨 **Fully Customizable** - Colors, sizes, and layouts
- 🎬 **Smooth Animations** - Credit circles fly from pool to diamonds with React Portal
- 📱 **Responsive** - Works on all screen sizes
- 🎯 **TypeScript** - Full type safety and IntelliSense support
- ♿ **Accessible** - Semantic HTML and ARIA labels
- 🎭 **Zero Dependencies** - Only requires React and React DOM
- ⚡ **Lightweight** - Minimal bundle size impact

## 📦 Installation

```bash
npm install quadratic-vote
```

or

```bash
yarn add quadratic-vote
```

or

```bash
pnpm add quadratic-vote
```

## 🚀 Quick Start

### Usage Option 1: Namespace Pattern (Recommended)

```tsx
import QuadraticVote, { Question, useQuadraticVote } from 'quadratic-vote'

function VotingInterface() {
  const { questions, vote, reset } = useQuadraticVote()

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      {/* Credit Pool */}
      <QuadraticVote.Pool creditColor='#D1D5DB' circleColor='#3B82F6' />

      {/* Questions */}
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
            Vote Yes
          </button>
          <button onClick={() => vote(q.id, -1)} disabled={q.isDisabledDown}>
            Vote No
          </button>
        </div>
      ))}

      <button onClick={reset}>Reset</button>
    </div>
  )
}

function App() {
  const questions: Question[] = [
    { question: 'Should we implement feature X?', vote: 0, id: 0 },
    { question: 'Should we prioritize performance?', vote: 0, id: 1 },
  ]

  return (
    <QuadraticVote.Provider credits={100} questions={questions}>
      <VotingInterface />
    </QuadraticVote.Provider>
  )
}
```

### Usage Option 2: Named Exports

```tsx
import {
  QuadraticVoteProvider,
  Pool,
  Diamond,
  useQuadraticVote,
  type Question,
} from 'quadratic-vote'

function VotingInterface() {
  const { questions, vote, reset } = useQuadraticVote()

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <Pool creditColor='#D1D5DB' circleColor='#3B82F6' />

      {questions.map((q) => (
        <div key={q.id}>
          <p>{q.question}</p>
          <Diamond
            id={q.id}
            neutralColor='#9CA3AF'
            positiveColor='#22C55E'
            negativeColor='#EF4444'
          />
          <button onClick={() => vote(q.id, 1)} disabled={q.isDisabledUp}>
            Vote Yes
          </button>
        </div>
      ))}
    </div>
  )
}

function App() {
  const questions: Question[] = [{ question: 'Should we implement feature X?', vote: 0, id: 0 }]

  return (
    <QuadraticVoteProvider credits={100} questions={questions}>
      <VotingInterface />
    </QuadraticVoteProvider>
  )
}
```

## 📚 API Reference

### `<QuadraticVote.Provider>`

The context provider that wraps your voting interface.

| Prop          | Type          | Required | Description                                  |
| ------------- | ------------- | -------- | -------------------------------------------- |
| `credits`     | `number`      | ✅       | Total voting credits (must be between 4-225) |
| `questions`   | `Question[]`  | ✅       | Array of questions to vote on                |
| `children`    | `ReactNode`   | ✅       | Your voting interface components             |
| `returnOrder` | `ReturnOrder` |          | Refill order, default `'first-out-last-in'`  |

#### `returnOrder`

Controls the order in which pool circles refill when credits come back from a diamond.

- `'first-out-last-in'` (default) — the circle that emptied first is the last to
  refill, so credits appear to retrace their steps. The pool behaves like a stack.
- `'first-out-first-in'` — the circle that emptied first refills first, so the block
  refills in the same direction it drained.

```tsx
<QuadraticVote.Provider credits={100} questions={questions} returnOrder='first-out-first-in'>
  {/* ... */}
</QuadraticVote.Provider>
```

### Previewing the cost of a vote

The price of the next vote is the thing respondents cannot see: at 3 votes the
next one costs 7, at 0 votes it costs 1, and the button looks identical either
way. `useQuadraticVote()` exposes a preview so you can show it before they commit.

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

While a preview is active `<Pool>` paints the credits it would move in
`previewColor` — the next free ones for a spend, the last spent ones for a
refund. The preview clears itself once the vote is cast.

`preview` is a `VotePreview`:

| Field        | Type               | Description                                 |
| ------------ | ------------------ | ------------------------------------------- |
| `id`         | `string \| number` | Question it refers to                       |
| `delta`      | `number`           | Delta being previewed, usually `+1`/`-1`    |
| `nextVote`   | `number`           | Vote the question would land on             |
| `cost`       | `number`           | Credits consumed, or returned when negative |
| `affordable` | `boolean`          | Whether the budget allows it                |
| `shortfall`  | `number`           | Credits missing when unaffordable, else `0` |

> **`cost` is not `2n + 1`.** That only holds while a vote moves _away_ from
> zero. Pressing "up" on a question sitting at `-3` moves it to `-2` and hands
> **5 credits back**, so `cost` is negative there. Label your buttons from
> `cost`, not from a formula, or half of them will be wrong.

#### Pricing without hover

`preview` is driven by hover, so it can only ever describe one control at a
time — and none at all on a touch device. `costOf(id, delta)` runs the same
calculation with no state behind it, so every control can carry its own price on
every render.

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

It returns the same `VotePreview` shape as `preview` and does not set it —
`previewVote` is defined in terms of `costOf`, so the two can never disagree.

### `<QuadraticVote.Pool>`

Displays the credit pool showing available and used credits with animated transitions.

| Prop            | Type      | Default     | Description                           |
| --------------- | --------- | ----------- | ------------------------------------- |
| `columns`       | `number`  | `5`         | Number of columns in the pool grid    |
| `circleRadius`  | `number`  | `4`         | Radius of each credit circle          |
| `circleSpacing` | `number`  | `4`         | Spacing between circles               |
| `reverse`       | `boolean` | `false`     | Reverse the fill direction            |
| `creditColor`   | `string`  | `'black'`   | Color of used credits                 |
| `circleColor`   | `string`  | `'grey'`    | Color of available credits            |
| `previewColor`  | `string`  | `'#F59E0B'` | Color of credits a preview would move |

### `<QuadraticVote.LiquidPool>`

Compact alternative to `<Pool>`, designed for mobile: the budget as a floating drop
of water with satellite droplets orbiting it. The droplets shrink and disappear one
by one as credits are spent, and the whole thing dries out at zero.

The blobs are plain SVG circles fused by a gooey filter — `feGaussianBlur` smears
neighbouring shapes together and `feColorMatrix` pushes the blurred alpha back to a
hard edge. That works on the alpha channel, so it needs no opaque backdrop, and the
filter region extends past the component box, so droplets and splashes are never
clipped.

`size` reserves a square footprint for layout; the liquid drifts freely outside it.

A credit flying to or from the pool is handed over at the liquid's edge: outside
it, it is a plain credit in its own colour; inside, the pool takes over drawing it
as a shape within the gooey filter, so it stretches toward the blob and merges
instead of sitting on top as a crisp circle. A credit coming home is also held
out of the balance until it actually lands, so a new droplet forms _around_ the
arriving credit rather than appearing the moment the vote is cast.

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

Droplets range from 15% to 35% of the main blob. Pushing `viscosity` much higher
dissolves them — the goo threshold erases any shape much smaller than the blur.

Motion runs on a single animation frame loop that writes SVG attributes directly, so
a frame costs no React render. It idles while the tab is hidden and freezes for
`prefers-reduced-motion`.

### `<QuadraticVote.Diamond>`

Displays a diamond-shaped vote indicator for a question.

| Prop            | Type     | Default     | Description                                     |
| --------------- | -------- | ----------- | ----------------------------------------------- |
| `id`            | `number` | ✅ Required | Question ID (must match a question in Provider) |
| `neutralColor`  | `string` | `'#A9A9A9'` | Color when no vote is cast                      |
| `positiveColor` | `string` | `'#00FF00'` | Color for positive votes                        |
| `negativeColor` | `string` | `'#FF0000'` | Color for negative votes                        |
| `circleRadius`  | `number` | `4`         | Radius of diamond circles                       |

### `useQuadraticVote()` Hook

Access voting state and actions.

```tsx
const {
  questions, // Current question state with vote counts
  credits, // Total credits
  availableCredits, // Remaining credits
  vote, // Cast a vote: (id, delta) => void
  reset, // Reset all votes to zero: () => void

  costOf, // Price a press without casting it: (id, delta) => VotePreview
  preview, // VotePreview | null — what previewVote last described
  previewVote, // Set preview, and highlight the credits in Pool: (id, delta) => void
  clearPreview, // Drop the current preview: () => void
} = useQuadraticVote()
```

See [Previewing the cost of a vote](#previewing-the-cost-of-a-vote) for the last
four.

### `Question` Type

```tsx
interface Question {
  id: number
  vote: number
  isDisabledUp?: boolean
  isDisabledDown?: boolean
  [key: string]: any // Additional custom properties
}
```

## 🎨 Customization Examples

### Custom Colors

```tsx
<QuadraticVote.Pool
  creditColor='#EF4444'    // Red for used credits
  circleColor='#10B981'    // Green for available
/>

<QuadraticVote.Diamond
  id={0}
  neutralColor='#6B7280'   // Gray neutral
  positiveColor='#3B82F6'  // Blue positive
  negativeColor='#F59E0B'  // Amber negative
/>
```

### Larger Pool

```tsx
<QuadraticVote.Pool columns={10} circleRadius={6} circleSpacing={6} />
```

## 🎬 Animation System

The library includes a sophisticated animation system using React Portals:

- Credits smoothly fly from the pool to diamonds when voting up
- Credits return from diamonds to the pool when voting down
- Animations track scroll position and adapt in real-time
- Color transitions are synchronized with flight animations
- Staggered animations for multiple credits create a flowing effect

The animation overlay is automatically managed by the `Provider` component.

## 🧪 Testing

The library includes comprehensive test coverage with Vitest and React Testing Library.

```bash
npm test              # Run tests
npm run test:ui       # Run tests with UI
npm run coverage      # Generate coverage report
```

## 🏗️ Building

```bash
npm run build         # Build for production
npm run dev           # Run demo app
```

## 📖 Examples

- **[Live Demo on CodeSandbox](https://codesandbox.io/s/quadratic-vote-nyk9nx)** - Interactive example
- See `/demo` directory for a complete implementation

## 📕 Storybook

Every component has interactive documentation with live prop controls, plus layout
recipes (desktop sidebar, mobile `LiquidPool` header, headless usage).

```bash
npm run storybook             # Dev server on http://localhost:6006
npm run build-storybook       # Static build in storybook-static/
npm run type-check:storybook  # Type-check stories only
```

Stories live in `/stories` and import from `src` directly, so the docs always
reflect the working tree. They are documentation-only — `package.json#files`
limits the published tarball to `dist`, and the library build and `npm run type-check`
never see them.

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) before submitting a PR.

## 📄 License

MIT © [Civicbase](https://github.com/civicbase)

## 🔗 Links

- [NPM Package](https://www.npmjs.com/package/quadratic-vote)
- [GitHub Repository](https://github.com/civicbase/quadratic-vote)
- [Issue Tracker](https://github.com/civicbase/quadratic-vote/issues)
- [Quadratic Voting Explained](https://en.wikipedia.org/wiki/Quadratic_voting)

## 💡 About Quadratic Voting

Quadratic voting is a collective decision-making procedure where participants express not just their preferences, but the intensity of those preferences. The cost of additional votes increases quadratically:

- 1 vote = 1 credit
- 2 votes = 4 credits
- 3 votes = 9 credits
- 4 votes = 16 credits
- etc.

This mechanism prevents tyranny of the majority while allowing those who care more about specific issues to have proportionally more influence on those particular decisions.
