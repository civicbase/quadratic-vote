// this is just a test and should be deleted once the library is ready
import QuadraticVote, { Question, useQuadraticVote } from "./QuadraticVote";

function App() {
  const questions: Question[] = [
    {
      question:
        "Should the city invest in a new public transportation system to reduce traffic congestion and improve sustainability?",
      qualquercoisa: 2,
      vote: 0,
      id: 0,
    },
    {
      question: "Do you support increasing the minimum wage to $15 per hour?",
      vote: 0,
      id: 1,
    },
    {
      question:
        "Should the government allocate more funding to improve public schools?",
      vote: 0,
      id: 2,
    },
    {
      question:
        "o you believe stricter environmental regulations are necessary to combat climate change?",
      vote: 0,
      id: 3,
    },
    {
      question:
        "Should the country adopt universal healthcare to provide healthcare coverage for all citizens?",
      vote: 0,
      id: 4,
    },
    {
      question:
        "Do you agree with the proposed tax policy changes aimed at reducing income inequality?",
      vote: 0,
      id: 5,
    },
  ];

  return (
    <QuadraticVote.Provider credits={100} questions={questions}>
      <Container />
    </QuadraticVote.Provider>
  );
}

function Container() {
  const { questions, vote } = useQuadraticVote();

  return (
    <div style={{ display: "flex", position: "relative" }}>
      <div
        id="side"
        style={{
          position: "sticky",
          padding: "1rem",
          height: "fit-content",
          top: 0,
        }}
      >
        <QuadraticVote.Pool circleColor="orange" creditColor="gray" />
      </div>

      <div id="container">
        {questions.map((q) => (
          <div
            key={q.id}
            style={{
              marginTop: 100,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <p style={{ maxWidth: 600, textAlign: "center" }}>{q.question}</p>
            <QuadraticVote.Diamond
              id={q.id}
              neutralColor="gray"
              positiveColor="orange"
              negativeColor="red"
            />
            <div>
              <button
                style={{ marginRight: 10 }}
                onClick={() => vote(q.id, 1)}
                disabled={q.isDisabledUp}
              >
                yes
              </button>
              <button
                onClick={() => vote(q.id, -1)}
                disabled={q.isDisabledDown}
              >
                no
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
