import React from 'react'
import '@testing-library/jest-dom/vitest'
import { act, cleanup, render } from '@testing-library/react'
import { describe, it, expect, afterEach, vi } from 'vitest'

import QuadraticVote, { useQuadraticVote } from '../QuadraticVote'
import { questions } from './test-utils'

describe('Pool Component', () => {
  // Explicit unmount: a surviving VoteAnimation would answer the next test's
  // events and release the holds under test early.
  afterEach(() => {
    cleanup()
    document.getElementById('animation-overlay')?.remove()
    // Unconditional: a test that fakes timers and then fails would otherwise
    // leave them faked for every test after it.
    vi.useRealTimers()
  })

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
      transition = window.getComputedStyle(circle).getPropertyValue('transition')
      expect(transitionExpect).equal(transition)
    })
  })

  /**
   * `usedCredits` jumps the instant a vote lands, so without these holds every
   * affected circle would recolour in the same frame instead of one at a time.
   */
  describe('staggered drain and refill', () => {
    const SPENT = 'rgb(0, 0, 0)'
    const AVAILABLE = 'rgb(128, 128, 128)'

    let api: ReturnType<typeof useQuadraticVote>

    const Probe = () => {
      api = useQuadraticVote()
      return null
    }

    const Setup = () => (
      <QuadraticVote.Provider credits={25} questions={questions}>
        <QuadraticVote.Pool creditColor={SPENT} circleColor={AVAILABLE} />
        <QuadraticVote.Diamond id={0} />
        <Probe />
      </QuadraticVote.Provider>
    )

    const poolCircles = (container: HTMLElement) =>
      Array.from(container.querySelectorAll('svg[data-pool="true"] circle'))

    const endPoolAnimation = (direction: 'toDiamond' | 'toPool', poolIndex: number) =>
      act(async () => {
        window.dispatchEvent(
          new CustomEvent('qv:anim-pool', {
            detail: { phase: 'end', direction, poolIndex },
          }),
        )
      })

    /**
     * VoteAnimation staggers these by a timer, one per credit. Waiting on that
     * schedule made the multi-credit test a race it lost on slower machines —
     * it asserted that every circle was still held while the later start events
     * had not fired yet. Pool's job is to respond to the events, so the test
     * sends them; VoteAnimation's own suite covers when they are sent.
     */
    const startPoolAnimation = (direction: 'toDiamond' | 'toPool', poolIndexes: number[]) =>
      act(async () => {
        for (const poolIndex of poolIndexes) {
          window.dispatchEvent(
            new CustomEvent('qv:anim', {
              detail: { phase: 'start', direction, poolIndex },
            }),
          )
        }
      })

    it('keeps a departing circle available until its credit has actually left', async () => {
      const { container } = render(<Setup />)

      await act(async () => {
        api.vote(0, 1)
      })

      // The credit is mid-flight, so the circle it came from must still read as
      // available even though the budget already counts it as spent.
      expect(poolCircles(container)[0].getAttribute('fill')).toBe(AVAILABLE)

      await endPoolAnimation('toDiamond', 0)

      expect(poolCircles(container)[0].getAttribute('fill')).toBe(SPENT)
    })

    it('keeps an arriving circle spent until its credit lands', async () => {
      const { container } = render(<Setup />)

      await act(async () => {
        api.vote(0, 1)
      })
      await endPoolAnimation('toDiamond', 0)
      expect(poolCircles(container)[0].getAttribute('fill')).toBe(SPENT)

      await act(async () => {
        api.vote(0, -1)
      })

      expect(poolCircles(container)[0].getAttribute('fill')).toBe(SPENT)

      await endPoolAnimation('toPool', 0)

      expect(poolCircles(container)[0].getAttribute('fill')).toBe(AVAILABLE)
    })

    it('drains each circle on its own schedule rather than all at once', async () => {
      // The Provider mounts a real VoteAnimation, which announces its own
      // starts and endings. Left running it landed extra credits partway
      // through the assertions, so the counts drifted on a slow runner.
      //
      // Faking the timers alone was not enough: its frame loop is driven by
      // requestAnimationFrame, which vitest does not fake by default, so it
      // kept dispatching. With both frozen the only events in play are the
      // ones this test sends.
      vi.useFakeTimers({
        toFake: [
          'setTimeout',
          'clearTimeout',
          'setInterval',
          'clearInterval',
          'requestAnimationFrame',
          'cancelAnimationFrame',
        ],
      })
      const { container } = render(<Setup />)

      // Three votes cost 9 credits at once.
      await act(async () => {
        api.vote(0, 1)
      })
      await act(async () => {
        api.vote(0, 1)
      })
      await act(async () => {
        api.vote(0, 1)
      })

      const spentCount = () =>
        poolCircles(container).filter((c) => c.getAttribute('fill') === SPENT).length

      // All nine credits are in flight, so the budget counts them spent while
      // the pool still shows every circle as available.
      await startPoolAnimation('toDiamond', [0, 1, 2, 3, 4, 5, 6, 7, 8])
      expect(spentCount()).toBe(0)

      // Each circle turns only when its own credit lands, not when the vote
      // was cast.
      await endPoolAnimation('toDiamond', 0)
      expect(spentCount()).toBe(1)

      await endPoolAnimation('toDiamond', 1)
      expect(spentCount()).toBe(2)
    })
  })
})
