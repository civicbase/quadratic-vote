<p align="center">
  <a href="https://github.com/civicbase" rel="noopener" target="_blank"><img width="350"  src="https://firebasestorage.googleapis.com/v0/b/civic-base.appspot.com/o/logos%2Fcivicbase_gradient_logo.svg?alt=media&token=a7036197-1c83-4585-a107-5f70d0c91333&_gl=1*1oktzd7*_ga*MTU2NTE1MTg2OS4xNjk4NDg2MTEy*_ga_CW55HF8NVT*MTY5OTI0ODEwMC4zLjEuMTY5OTI0ODI2NC4zMi4wLjA.
" alt="Civicbase Logo"></a>
</p>

<h1 align="center">Quadratic-Vote</h1>

<div align="center">

[![license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/mui/material-ui/blob/HEAD/LICENSE)
[![npm latest package](https://img.shields.io/npm/v/quadratic-vote/latest.svg)](https://www.npmjs.com/package/quadratic-vote)
[![npm downloads](https://img.shields.io/npm/dm/quadratic-vote.svg)](https://www.npmjs.com/package/quadratic-vote)

</div>

**Quadratic-Vote** is a React component library for implementing quadratic voting in web applications. Quadratic voting is a voting system where participants allocate votes to express the intensity of their preferences, rather than just the direction.

## Installation

To install Quadratic-Vote, run the following command in your project directory:

```bash
npm install quadratic-vote
```

or

```bash
yarn add quadratic-vote
```

## Example

For a live demonstration and code examples, check out our interactive example on CodeSandbox:

**[Quadratic-Vote Example on CodeSandbox](https://codesandbox.io/s/quadratic-vote-nyk9nx)**

This example showcases a typical implementation of the Quadratic-Vote component in a React application. It includes various questions and demonstrates the voting mechanism along with UI components such as the voting pool and diamond-shaped indicators.

Feel free to experiment with the code in the sandbox to get a better understanding of how to integrate and customize Quadratic-Vote in your own projects.

## Usage

### Importing

```js
import QuadraticVote, { Question, useQuadraticVote } from "quadratic-vote";
```

### Setting Up Your Component

Here is an example of how to set up a basic voting component using QuadraticVote:

```js
function Container() {
  const { questions, vote, reset } = useQuadraticVote();

  // ... (component implementation)
}

function App() {
  const questions = [
    // ... (list of questions)
  ];

  return (
    <QuadraticVote.Provider credits={100} questions={questions}>
      <Container />
    </QuadraticVote.Provider>
  );
}

export default App;
```

### Defining Questions

Define your questions in the following format:

```js
const questions: Question[] = [
  {
    question: "Your question here?", // this is additional and not required. Can be accessed under <QuadraticVote.Provider>
    vote: 0,
    id: 0,
    // ... additional properties,
  },
  // ... more questions
];
```

### Component Structure

The Container function demonstrates a typical setup. You can customize styles and layout as needed.

### Voting and Resetting

Use the vote function to handle vote submissions and the reset function to reset votes.

### Customization

You can customize the appearance and behavior of the voting components. For example, you can change the colors of the voting pool, diamonds, and buttons.

Example: https://codesandbox.io/s/quadratic-vote-nyk9nx
