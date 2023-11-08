import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import { QuadraticVote } from '../QuadraticVote'
import { questions } from './test-utils'

describe('Pool Component', () => {
  // const creditColor = "black";
  const circleColor = 'grey'

  const CustomComponent = ({
    credits,
    reverse,
    circleColor,
    creditColor,
    ...props
  }: {
    credits: number
    reverse: boolean | undefined
    circleColor: string | undefined
    creditColor: string | undefined
  }) => {
    return (
      <QuadraticVote.Provider credits={credits} questions={questions}>
        <QuadraticVote.Pool
          circleColor={circleColor}
          reverse={reverse}
          creditColor={creditColor}
          {...props}
        />
      </QuadraticVote.Provider>
    )
  }

  it('Should render the square root of credits as pool circle and computer value of id', async () => {
    const credits = 100

    const { container } = render(
      <CustomComponent
        credits={credits}
        reverse={undefined}
        circleColor={undefined}
        creditColor={undefined}
      />,
    )

    const circles = container.querySelectorAll('circle')

    circles.forEach((circle, index) => {
      expect(circle.getAttribute('id')).toBe(`pool-${index}`)
    })
  })

  // Example: Assert that a specific text/content is rendered in the component
  it('Should render the square root of 100 credits as pool', async () => {
    const credits = 100

    const { container } = render(
      <CustomComponent
        credits={credits}
        reverse={undefined}
        circleColor={undefined}
        creditColor={undefined}
      />,
    )

    expect(container.querySelectorAll('circle')).toHaveLength(100)
  })

  it('renders circles with correct default fill styles', () => {
    const credits = 100
    let fillColor

    const { container } = render(
      <CustomComponent
        credits={credits}
        reverse={undefined}
        circleColor={undefined}
        creditColor={undefined}
      />,
    )

    const circles = container.querySelectorAll('circle')

    circles.forEach((circle) => {
      fillColor = circle.getAttribute('fill')
      expect(circleColor).toBe(fillColor)
    })
  })

  it('renders circles with correct default transition styles', () => {
    const credits = 100
    const transitionExpect: string = 'fill 0.35s ease-out'
    let transition

    const { container } = render(
      <CustomComponent
        credits={credits}
        reverse={undefined}
        circleColor={undefined}
        creditColor={undefined}
      />,
    )

    const circles = container.querySelectorAll('circle')

    circles.forEach((circle) => {
      transition = window
        .getComputedStyle(circle)
        .getPropertyValue('transition')
      expect(transitionExpect).equal(transition)
    })
  })
})
