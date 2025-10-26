# API Design Guide

This document explains the API design decisions for quadratic-vote.

## 📦 Import Patterns

The library supports **both** namespace and named export patterns for maximum flexibility.

### Pattern 1: Namespace (Recommended) ✨

```tsx
import QuadraticVote, { useQuadraticVote, type Question } from 'quadratic-vote'
;<QuadraticVote.Provider credits={100} questions={questions}>
  <QuadraticVote.Pool />
  <QuadraticVote.Diamond id={0} />
</QuadraticVote.Provider>
```

**Pros:**

- ✅ Clear component relationships - all components are under `QuadraticVote.*`
- ✅ No naming conflicts - `Pool` and `Diamond` are namespaced
- ✅ Cleaner in larger apps with many imports
- ✅ Similar to popular libraries (Radix UI, React Router)
- ✅ Easy to identify where components come from

**Use when:**

- Building larger applications
- Want clear component namespacing
- Prefer cleaner imports at the top of files

### Pattern 2: Named Exports

```tsx
import {
  QuadraticVoteProvider,
  Pool,
  Diamond,
  useQuadraticVote,
  type Question,
} from 'quadratic-vote'
;<QuadraticVoteProvider credits={100} questions={questions}>
  <Pool />
  <Diamond id={0} />
</QuadraticVoteProvider>
```

**Pros:**

- ✅ More familiar to developers used to Material-UI, Ant Design
- ✅ Slightly shorter component names in JSX
- ✅ Better for tree-shaking in some bundlers
- ✅ More explicit about what you're importing

**Use when:**

- Building smaller applications or demos
- Prefer explicit imports
- Coming from Material-UI or similar libraries
- Want shorter JSX component names

## 🎯 Which to Choose?

### For Your App Code: Either works!

Both patterns are fully supported and will continue to be. Choose based on your team's preference.

### For Documentation/Examples: Namespace Pattern

We recommend the namespace pattern in documentation because:

1. It's clearer for newcomers
2. Shows component relationships
3. Avoids confusion with built-in components

## 📚 Complete Import Reference

### All Available Imports

```tsx
// Default namespace export
import QuadraticVote from 'quadratic-vote'

// Named component exports
import {
  QuadraticVoteProvider,
  Pool,
  Diamond,
  useQuadraticVote,
  VoteAnimation,
} from 'quadratic-vote'

// Type exports
import type {
  Question,
  QuadraticVoteType,
  DiamondProps,
  PoolProps,
  LaunchAnimationPayload,
  VoteAnimationProps,
} from 'quadratic-vote'
```

### Mix and Match

You can even mix patterns:

```tsx
import QuadraticVote, { useQuadraticVote, type Question } from 'quadratic-vote'

function MyComponent() {
  const { questions, vote } = useQuadraticVote()

  return (
    <QuadraticVote.Provider credits={100} questions={questions}>
      <QuadraticVote.Pool />
    </QuadraticVote.Provider>
  )
}
```

## 🔄 Migration Between Patterns

Easy to switch if you change your mind:

### From Namespace to Named Exports

```tsx
// Before
import QuadraticVote from 'quadratic-vote'
;<QuadraticVote.Provider>
  <QuadraticVote.Pool />
</QuadraticVote.Provider>

// After
import { QuadraticVoteProvider, Pool } from 'quadratic-vote'
;<QuadraticVoteProvider>
  <Pool />
</QuadraticVoteProvider>
```

### From Named Exports to Namespace

```tsx
// Before
import { QuadraticVoteProvider, Pool } from 'quadratic-vote'
;<QuadraticVoteProvider>
  <Pool />
</QuadraticVoteProvider>

// After
import QuadraticVote from 'quadratic-vote'
;<QuadraticVote.Provider>
  <QuadraticVote.Pool />
</QuadraticVote.Provider>
```

## 🎨 Real-World Examples

### Example 1: Small Demo (Named Exports)

```tsx
import { QuadraticVoteProvider, Pool, Diamond, useQuadraticVote } from 'quadratic-vote'

export default function Demo() {
  const questions = [
    { id: 0, vote: 0, question: 'Feature A?' },
    { id: 1, vote: 0, question: 'Feature B?' },
  ]

  return (
    <QuadraticVoteProvider credits={100} questions={questions}>
      <VotingUI />
    </QuadraticVoteProvider>
  )
}

function VotingUI() {
  const { questions, vote } = useQuadraticVote()

  return (
    <>
      <Pool />
      {questions.map((q) => (
        <Diamond key={q.id} id={q.id} />
      ))}
    </>
  )
}
```

### Example 2: Large Application (Namespace)

```tsx
import QuadraticVote, { useQuadraticVote, type Question } from 'quadratic-vote'
import { Button } from './components/Button'
import { Card } from './components/Card'
import { Layout } from './layouts/Layout'

export default function VotingPage() {
  const questions: Question[] = loadQuestions()

  return (
    <Layout>
      <QuadraticVote.Provider credits={100} questions={questions}>
        <VotingInterface />
      </QuadraticVote.Provider>
    </Layout>
  )
}

function VotingInterface() {
  const { questions, vote, availableCredits } = useQuadraticVote()

  return (
    <Card>
      <QuadraticVote.Pool creditColor='#3B82F6' />
      <p>Available: {availableCredits}</p>
      {questions.map((q) => (
        <QuadraticVote.Diamond key={q.id} id={q.id} />
      ))}
    </Card>
  )
}
```

## 🚀 TypeScript Benefits

Both patterns have full TypeScript support:

```tsx
// Namespace pattern
import QuadraticVote from 'quadratic-vote'
import type { Question, DiamondProps } from 'quadratic-vote'

const props: DiamondProps = { id: 0, positiveColor: '#00FF00' }
const question: Question = { id: 0, vote: 0 }

// Named exports
import { Diamond, type DiamondProps, type Question } from 'quadratic-vote'

const props: DiamondProps = { id: 0, positiveColor: '#00FF00' }
const question: Question = { id: 0, vote: 0 }
```

## 📝 Summary

| Aspect           | Namespace Pattern    | Named Exports    |
| ---------------- | -------------------- | ---------------- |
| Component naming | `QuadraticVote.Pool` | `Pool`           |
| Import line      | Shorter              | Longer           |
| JSX code         | More verbose         | Shorter          |
| Clarity          | Very clear           | Good             |
| Conflicts        | None                 | Possible         |
| Familiarity      | Moderate             | High             |
| Recommended for  | Production apps      | Demos/small apps |

**Bottom line:** Use what feels best for your team. Both are fully supported! 🎉
