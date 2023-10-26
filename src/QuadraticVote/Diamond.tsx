import { cloneElement, useMemo } from "react";
import { useQuadraticVote } from ".";
import { createDiamond, setViewBox } from "./utils";

interface DiamondProps {
  id: number;
  neutralColor?: string;
  positiveColor?: string;
  negativeColor?: string;
  circleRadius?: number;
}

const Diamond: React.FC<DiamondProps> = ({
  id,
  neutralColor = "#A9A9A9",
  positiveColor = "#00FF00",
  negativeColor = "#FF0000",
  circleRadius = 4,
}) => {
  const { questions, credits } = useQuadraticVote();

  const circles = useMemo(
    () => createDiamond(id, credits, circleRadius),
    [id, credits, circleRadius]
  );

  const question = useMemo(
    () => questions.find((q) => q.id === id),
    [questions, id]
  );
  const voteLevel = question ? Math.abs(question.vote) : 0;
  const voteColor = question
    ? question.vote > 0
      ? positiveColor
      : negativeColor
    : neutralColor;

  const viewBox = useMemo(() => setViewBox(circles), [circles]);

  return (
    <svg
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      width={viewBox.width}
      height={viewBox.height}
    >
      <g>
        {circles.map((circle) => {
          const circleLevel = parseInt(
            circle.props["data-level"].split("-")[1]
          );
          const fillColor = circleLevel <= voteLevel ? voteColor : neutralColor;

          return cloneElement(circle, {
            style: { fill: fillColor, transition: "fill 0.35s ease-out" },
          });
        })}
      </g>
    </svg>
  );
};

export default Diamond;
