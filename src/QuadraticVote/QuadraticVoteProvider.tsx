import { ReactNode, createContext, useState, useEffect } from "react";

export type Question = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  vote: number;
  id: number;
  isDisabledUp?: boolean;
  isDisabledDown?: boolean;
};

interface QuadraticVoteType {
  questions: Question[];
  vote: (id: number, vote: number) => void;
  credits: number;
  availableCredits: number;
}

export const QuadraticVote = createContext<QuadraticVoteType>(null!);

const QuadraticVoteProvider = ({
  children,
  credits,
  questions: qs,
}: {
  children: ReactNode;
  credits: number;
  questions: Question[];
}) => {
  const [questions, setQuestions] = useState(qs);

  const [availableCredits, setAvailableCredits] = useState(credits);

  useEffect(() => {
    setAvailableCredits(
      credits - questions.reduce((acc, q) => acc + q.vote ** 2, 0)
    );
  }, [questions, credits]);

  const canVote = (
    questions: Question[],
    id: number,
    potentialVote: number
  ) => {
    let simulatedCost = 0;

    questions.forEach((q) => {
      if (q.id === id) {
        simulatedCost += Math.abs(potentialVote) ** 2;
      } else {
        simulatedCost += Math.abs(q.vote) ** 2;
      }
    });

    return simulatedCost <= credits;
  };

  const vote = (id: number, voteAmount: number) => {
    if (canVote(questions, id, voteAmount)) {
      const updatedQuestions = questions.map((q) => {
        if (q.id === id) {
          return { ...q, vote: q.vote + voteAmount };
        }
        return q;
      });

      const newQuestions = updatedQuestions.map((q) => {
        return {
          ...q,
          isDisabledUp: !canVote(updatedQuestions, q.id, q.vote + 1),
          isDisabledDown: !canVote(updatedQuestions, q.id, q.vote - 1),
        };
      });

      setQuestions(newQuestions);
    }
  };

  return (
    <QuadraticVote.Provider
      value={{
        credits,
        availableCredits,
        questions,

        vote,
      }}
    >
      {children}
    </QuadraticVote.Provider>
  );
};

export default QuadraticVoteProvider;
