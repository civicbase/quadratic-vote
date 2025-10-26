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

| Prop        | Type         | Required | Description                                  |
| ----------- | ------------ | -------- | -------------------------------------------- |
| `credits`   | `number`     | ✅       | Total voting credits (must be between 4-225) |
| `questions` | `Question[]` | ✅       | Array of questions to vote on                |
| `children`  | `ReactNode`  | ✅       | Your voting interface components             |

### `<QuadraticVote.Pool>`

Displays the credit pool showing available and used credits with animated transitions.

| Prop            | Type      | Default   | Description                        |
| --------------- | --------- | --------- | ---------------------------------- |
| `columns`       | `number`  | `5`       | Number of columns in the pool grid |
| `circleRadius`  | `number`  | `4`       | Radius of each credit circle       |
| `circleSpacing` | `number`  | `4`       | Spacing between circles            |
| `reverse`       | `boolean` | `false`   | Reverse the fill direction         |
| `creditColor`   | `string`  | `'black'` | Color of used credits              |
| `circleColor`   | `string`  | `'grey'`  | Color of available credits         |

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
  vote, // Function to cast a vote: (id: number, amount: number) => void
  reset, // Function to reset all votes: () => void
} = useQuadraticVote()
```

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
