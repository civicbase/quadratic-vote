import { useMemo } from "react";
import { useQuadraticVote } from ".";
import { setViewBox } from "./utils";

interface PoolProps {
  columns?: number;
  circleRadius?: number;
  circleSpacing?: number;
  reverse?: boolean;
  creditColor?: string;
  circleColor?: string;
}

function Pool({
  columns = 5,
  circleRadius = 4,
  circleSpacing = 4,
  reverse = false,
  creditColor = "black",
  circleColor = "grey",
}: PoolProps) {
  const { credits, availableCredits } = useQuadraticVote();
  const usedCredits = credits - availableCredits;

  const circles = useMemo(() => {
    const circleElements: JSX.Element[] = [];

    for (let i = 0; i < credits; i++) {
      const column = i % columns;
      const row = Math.floor(i / columns);

      // Adjusting the cx and cy based on circleRadius
      const cx = column * (circleRadius * 2 + circleSpacing) + circleRadius;
      const cy = row * (circleRadius * 2 + circleSpacing) + circleRadius;

      const isUsedCredit = reverse
        ? i >= credits - usedCredits
        : i < usedCredits;
      const fillColor = isUsedCredit ? creditColor : circleColor;

      circleElements.push(
        <circle
          id={`pool-${i}`}
          key={i}
          cx={cx}
          cy={cy}
          r={circleRadius}
          fill={fillColor}
          style={{ transition: "fill 0.35s ease-out" }}
        />
      );
    }

    return circleElements;
  }, [
    credits,
    circleRadius,
    circleSpacing,
    columns,
    reverse,
    creditColor,
    circleColor,
    usedCredits,
  ]);

  const viewBox = useMemo(() => setViewBox(circles), [circles]);

  return (
    <svg
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      width={viewBox.width}
      height={viewBox.height}
    >
      {circles}
    </svg>
  );
}

export default Pool;
