import React, { ReactElement } from "react";

export const setViewBox = (circles: ReactElement[]) => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  // Go through each circle and determine the bounding box
  circles.forEach((circle) => {
    const cx = circle.props.cx;
    const cy = circle.props.cy;
    const r = circle.props.r;

    if (cx === undefined || cy === undefined || r === undefined) return;

    // Calculate bounds for this circle
    const left = cx - r;
    const right = cx + r;
    const top = cy - r;
    const bottom = cy + r;

    // Update the overall bounds
    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, right);
    maxY = Math.max(maxY, bottom);
  });

  // Set the viewBox for the SVG
  const width = maxX - minX;
  const height = maxY - minY;

  return {
    x: minX,
    y: minY,
    width: width,
    height: height,
  };
};

export const createDiamond = (
  id: number,
  credits: number,
  radius: number = 4
): ReactElement[] => {
  const circles: ReactElement[] = [];
  const maxLevel = Math.abs(Math.sqrt(credits));

  for (let level: number = 1; level <= maxLevel; level++) {
    let cx: number = -radius * 4 * level;
    let cy: number = 0;

    const numCirclesAtLevel = 2 * level - 1;
    for (let ai: number = 0; ai < numCirclesAtLevel; ai++) {
      circles.push(
        <circle
          key={`diamond-${id}-${level}-${ai}`}
          r={radius}
          cx={cx}
          cy={cy}
          data-level={`${id}-${level}`}
          data-ai={ai}
        />
      );

      // Adjusted the calculations for variable radius
      cx += ai % 2 === 0 ? radius * 2 : 0;
      cy = ai % 2 === 0 ? -Math.abs(cy) - radius * 2 : Math.abs(cy);
    }
  }

  return circles;
};
