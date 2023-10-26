import { useContext } from "react";
import Provider, {
  QuadraticVote as QuadraticVoteContext,
} from "./QuadraticVoteProvider";
import Pool from "./Pool";
import Diamond from "./Diamond";

export const useQuadraticVote = () => {
  const context = useContext(QuadraticVoteContext);

  if (!context) {
    throw new Error(
      `useQuadraticVote must be called inside a <QuadraticVote.Provider>`
    );
  }

  return context;
};

const QuadraticVote = {
  Provider,
  Pool,
  Diamond,
  Animation,
};

export default QuadraticVote;

export type { Question } from "./QuadraticVoteProvider";
