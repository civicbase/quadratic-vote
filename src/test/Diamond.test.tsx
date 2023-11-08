import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { QuadraticVote } from '../QuadraticVote'
import { questions } from './test-utils'

describe('Diamond Component', () => {
  const neutralColor = '#A9A9A9'
  const greenColor = '#52BE80'

  const CustomComponent = ({
    credits,
    id,
    neutralColor,
    positiveColor,
    negativeColor,
    ...props
  }: {
    credits: number
    id: number
    neutralColor: string | undefined
    positiveColor: string | undefined
    negativeColor: string | undefined
  }) => {
    return (
      <QuadraticVote.Provider credits={credits} questions={questions}>
        <QuadraticVote.Diamond
          id={id}
          neutralColor={neutralColor}
          positiveColor={positiveColor}
          negativeColor={negativeColor}
          {...props}
        />
      </QuadraticVote.Provider>
    )
  }

  it('Should render the square root of 100 credits as diamond circle', async () => {
    const id = 1
    const credits = 100

    const { container } = render(
      <CustomComponent
        credits={credits}
        id={id}
        neutralColor={undefined}
        positiveColor={undefined}
        negativeColor={undefined}
      />,
    )

    const maxLevel = Math.abs(Math.sqrt(credits))

    expect(container.querySelectorAll('circle')).toHaveLength(maxLevel ** 2)
  })

  it('Should render the square root of credits as diamond circle and computer elements in each data-level', async () => {
    const id = 1
    const credits = 100

    const { container } = render(
      <CustomComponent
        credits={credits}
        id={id}
        neutralColor={undefined}
        positiveColor={undefined}
        negativeColor={undefined}
      />,
    )

    const level01 = container.querySelectorAll(`circle[data-level="${id}-1"]`)
    const level02 = container.querySelectorAll(`circle[data-level="${id}-2"]`)
    const level03 = container.querySelectorAll(`circle[data-level="${id}-3"]`)
    const level04 = container.querySelectorAll(`circle[data-level="${id}-4"]`)
    const level05 = container.querySelectorAll(`circle[data-level="${id}-5"]`)
    const level06 = container.querySelectorAll(`circle[data-level="${id}-6"]`)
    const level07 = container.querySelectorAll(`circle[data-level="${id}-7"]`)
    const level08 = container.querySelectorAll(`circle[data-level="${id}-8"]`)
    const level09 = container.querySelectorAll(`circle[data-level="${id}-9"]`)
    const level10 = container.querySelectorAll(`circle[data-level="${id}-10"]`)

    expect(level01.length).toBe(1)
    expect(level02.length).toBe(3)
    expect(level03.length).toBe(5)
    expect(level04.length).toBe(7)
    expect(level05.length).toBe(9)
    expect(level06.length).toBe(11)
    expect(level07.length).toBe(13)
    expect(level08.length).toBe(15)
    expect(level09.length).toBe(17)
    expect(level10.length).toBe(19)
  })

  it('Should render the square root of credits as diamond circle and computer elements', async () => {
    const id = 1
    const credits = 100

    const { container } = render(
      <CustomComponent
        credits={credits}
        id={id}
        neutralColor={undefined}
        positiveColor={undefined}
        negativeColor={undefined}
      />,
    )

    const circles = container.querySelectorAll('circle').length

    expect(credits).toBe(circles)
  })

  it('Should render the square root of credits as diamond circle and computer value of data-ai', async () => {
    const id = 1
    const credits = 100

    const { container } = render(
      <CustomComponent
        credits={credits}
        id={id}
        neutralColor={undefined}
        positiveColor={undefined}
        negativeColor={undefined}
      />,
    )

    const level01 = container.querySelectorAll(`circle[data-level="${id}-1"]`)
    const level02 = container.querySelectorAll(`circle[data-level="${id}-2"]`)
    const level03 = container.querySelectorAll(`circle[data-level="${id}-3"]`)
    const level04 = container.querySelectorAll(`circle[data-level="${id}-4"]`)
    const level05 = container.querySelectorAll(`circle[data-level="${id}-5"]`)
    const level06 = container.querySelectorAll(`circle[data-level="${id}-6"]`)
    const level07 = container.querySelectorAll(`circle[data-level="${id}-7"]`)
    const level08 = container.querySelectorAll(`circle[data-level="${id}-8"]`)
    const level09 = container.querySelectorAll(`circle[data-level="${id}-9"]`)
    const level10 = container.querySelectorAll(`circle[data-level="${id}-10"]`)

    level01.forEach((circle, index) => {
      expect(circle.getAttribute('data-ai')).toBe(`${index}`)
    })

    level02.forEach((circle, index) => {
      expect(circle.getAttribute('data-ai')).toBe(`${index}`)
    })

    level03.forEach((circle, index) => {
      expect(circle.getAttribute('data-ai')).toBe(`${index}`)
    })

    level04.forEach((circle, index) => {
      expect(circle.getAttribute('data-ai')).toBe(`${index}`)
    })

    level05.forEach((circle, index) => {
      expect(circle.getAttribute('data-ai')).toBe(`${index}`)
    })

    level06.forEach((circle, index) => {
      expect(circle.getAttribute('data-ai')).toBe(`${index}`)
    })

    level07.forEach((circle, index) => {
      expect(circle.getAttribute('data-ai')).toBe(`${index}`)
    })

    level08.forEach((circle, index) => {
      expect(circle.getAttribute('data-ai')).toBe(`${index}`)
    })

    level09.forEach((circle, index) => {
      expect(circle.getAttribute('data-ai')).toBe(`${index}`)
    })

    level10.forEach((circle, index) => {
      expect(circle.getAttribute('data-ai')).toBe(`${index}`)
    })
  })

  it('Should render with default colors and radius', async () => {
    const id = 1
    const credits = 100
    let computedStyle

    const { container } = render(
      <CustomComponent
        credits={credits}
        id={id}
        neutralColor={undefined}
        positiveColor={undefined}
        negativeColor={undefined}
      />,
    )

    const circles = container.querySelectorAll('circle')

    circles.forEach((circle) => {
      computedStyle = window.getComputedStyle(circle)
      expect(computedStyle.getPropertyValue('fill')).toBe(`${neutralColor}`)
    })
  })

  it('Should render with greenColor colors and radius', async () => {
    const id = 1
    const credits = 100
    let computedStyle

    const { container } = render(
      <CustomComponent
        credits={credits}
        id={id}
        neutralColor={greenColor}
        positiveColor={undefined}
        negativeColor={undefined}
      />,
    )

    const circles = container.querySelectorAll('circle')

    circles.forEach((circle) => {
      computedStyle = window.getComputedStyle(circle)
      expect(computedStyle.getPropertyValue('fill')).toBe(`${greenColor}`)
    })
  })

  it('renders circles with correct fill styles', () => {
    const id = 1
    const credits = 100
    let fillColor

    const { container } = render(
      <CustomComponent
        credits={credits}
        id={id}
        neutralColor={undefined}
        positiveColor={undefined}
        negativeColor={undefined}
      />,
    )

    const circles = container.querySelectorAll('circle')

    circles.forEach((circle) => {
      fillColor = window.getComputedStyle(circle).getPropertyValue('fill')
      expect(neutralColor).toBe(fillColor)
    })
  })

  it('renders circles with correct default transition styles', () => {
    const id = 1
    const credits = 100
    const transitionExpect: string = 'fill 0.35s ease-out'
    let transition

    const { container } = render(
      <CustomComponent
        credits={credits}
        id={id}
        neutralColor={undefined}
        positiveColor={undefined}
        negativeColor={undefined}
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

  it('Should render the square root of credits as diamond circle and computer elements XXX', async () => {
    const id = 1
    const credits = 100

    const { container } = render(
      <CustomComponent
        credits={credits}
        id={id}
        neutralColor={undefined}
        positiveColor={undefined}
        negativeColor={undefined}
      />,
    )

    const circles = container.querySelectorAll('circle').length

    expect(circles).toBe(Math.pow(Math.trunc(Math.sqrt(credits)), 2))
  })
})
