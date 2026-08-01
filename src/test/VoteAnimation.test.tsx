import '@testing-library/jest-dom/vitest'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import QuadraticVote, { Question, ReturnOrder, useQuadraticVote } from '../QuadraticVote'

const POSITIVE = 'rgb(0, 128, 0)'
const NEGATIVE = 'rgb(255, 0, 0)'
const SPENT = 'rgb(0, 0, 0)'
const AVAILABLE = 'rgb(128, 128, 128)'

const questions: Question[] = [{ question: 'Only question', vote: 0, id: 0 }]

let api: ReturnType<typeof useQuadraticVote>

function Probe() {
  api = useQuadraticVote()
  return null
}

function Harness({
  returnOrder,
  reverse = false,
}: {
  returnOrder?: ReturnOrder
  reverse?: boolean
}) {
  return (
    <QuadraticVote.Provider credits={25} questions={questions} returnOrder={returnOrder}>
      <QuadraticVote.Pool reverse={reverse} creditColor={SPENT} circleColor={AVAILABLE} />
      <QuadraticVote.Diamond id={0} positiveColor={POSITIVE} negativeColor={NEGATIVE} />
      <Probe />
    </QuadraticVote.Provider>
  )
}

/** Pool indices announced for a given direction, in the order they were launched. */
function recordLaunchOrder(direction: 'toDiamond' | 'toPool') {
  const seen: number[] = []
  const handler = (e: Event) => {
    const detail = (e as CustomEvent).detail
    if (detail?.direction === direction) seen.push(detail.poolIndex)
  }
  window.addEventListener('qv:anim', handler)
  return {
    seen,
    stop: () => window.removeEventListener('qv:anim', handler),
  }
}

function flightNodes() {
  const overlay = document.getElementById('animation-overlay')
  return overlay ? Array.from(overlay.children) : []
}

/**
 * Colours of the credits launched by `action` only. Flights from earlier votes
 * linger in the overlay until their timers prune them, so comparing against the
 * nodes that existed beforehand is the only reliable way to isolate a burst.
 */
async function colorsLaunchedBy(action: () => Promise<void>) {
  const before = new Set(flightNodes())
  await action()
  return flightNodes()
    .filter((node) => !before.has(node))
    .map((node) => (node as HTMLElement).style.background)
}

async function vote(delta: number) {
  await act(async () => {
    api.vote(0, delta)
  })
}

describe('VoteAnimation', () => {
  beforeEach(() => {
    document.getElementById('animation-overlay')?.remove()
  })

  afterEach(() => {
    // Unmount explicitly rather than relying on auto-cleanup: a surviving
    // VoteAnimation keeps its window listener and answers the next test's
    // launch event too, producing duplicated flights.
    cleanup()
    document.getElementById('animation-overlay')?.remove()
  })

  describe('return order', () => {
    it('refills the freed block back to front by default, so the first circle out is the last in', async () => {
      render(<Harness />)

      // Three votes cost 9 credits, emptying circles 0..8 in ascending order.
      await vote(1)
      await vote(1)
      await vote(1)

      const recorder = recordLaunchOrder('toPool')
      // Dropping to two votes frees 5 credits: circles 4..8.
      await vote(-1)
      recorder.stop()

      expect(recorder.seen).toEqual([8, 7, 6, 5, 4])
    })

    it('refills front to back when asked for first-out-first-in', async () => {
      render(<Harness returnOrder='first-out-first-in' />)

      await vote(1)
      await vote(1)
      await vote(1)

      const recorder = recordLaunchOrder('toPool')
      await vote(-1)
      recorder.stop()

      expect(recorder.seen).toEqual([4, 5, 6, 7, 8])
    })

    it('still sends credits out in ascending order', async () => {
      render(<Harness />)

      const recorder = recordLaunchOrder('toDiamond')
      await vote(1)
      await vote(1)
      recorder.stop()

      // 1 credit for the first vote, then 3 more to reach 4.
      expect(recorder.seen).toEqual([0, 1, 2, 3])
    })
  })

  describe('reverse pools', () => {
    it('animates the circles the pool actually marks spent', async () => {
      const { container } = render(<Harness reverse />)

      const recorder = recordLaunchOrder('toDiamond')
      await vote(1)
      recorder.stop()

      const poolCircles = Array.from(container.querySelectorAll('svg[data-pool="true"] circle'))
      // A reversed pool fills from the far end, so credit 0 is the last circle.
      expect(recorder.seen).toEqual([poolCircles.length - 1])
    })

    it('holds the reversed circle at the available colour until its credit leaves', async () => {
      const { container } = render(<Harness reverse />)

      await vote(1)

      const poolCircles = Array.from(container.querySelectorAll('svg[data-pool="true"] circle'))
      const last = poolCircles[poolCircles.length - 1]
      expect(last.getAttribute('fill')).toBe(AVAILABLE)

      await act(async () => {
        window.dispatchEvent(
          new CustomEvent('qv:anim-pool', {
            detail: {
              phase: 'end',
              direction: 'toDiamond',
              poolIndex: poolCircles.length - 1,
            },
          }),
        )
      })

      expect(last.getAttribute('fill')).toBe(SPENT)
    })
  })

  describe('credit colour', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    /**
     * Circles that have just been voted onto a diamond are held at the neutral
     * colour until their arrival timer fires. Without draining those timers the
     * diamond never reaches its vote colour, and the probe under test would be
     * reading a transient state rather than a settled one.
     */
    async function settleArrivals() {
      await act(async () => {
        vi.advanceTimersByTime(3000)
      })
    }

    /**
     * The Provider dispatches this synchronously from `vote()`, before React has
     * committed the new state, so the diamond is still showing the vote colour
     * when VoteAnimation probes it. `act()` flushes first, which would hide the
     * behaviour under test — hence dispatching the payload directly with the
     * diamond parked in a known state.
     */
    function launchReturn(diamondLevel: number, count: number) {
      window.dispatchEvent(
        new CustomEvent('qv:launch-animation', {
          detail: {
            direction: 'toPool',
            poolStartIndex: 0,
            diamondId: 0,
            diamondLevel,
            count,
          },
        }),
      )
    }

    it('carries the diamond vote colour home rather than falling back to black', async () => {
      render(<Harness />)

      await vote(1)
      await vote(1)
      await settleArrivals()

      // Diamond paints through `style.fill`, so a probe that only reads the
      // `fill` attribute silently returns black here.
      const colors = await colorsLaunchedBy(async () => {
        await act(async () => launchReturn(2, 3))
      })

      expect(colors).toHaveLength(3)
      colors.forEach((color) => expect(color).toBe(POSITIVE))
    })

    it('uses the negative colour for credits returning from a downvote', async () => {
      render(<Harness />)

      await vote(-1)
      await vote(-1)
      await settleArrivals()

      const colors = await colorsLaunchedBy(async () => {
        await act(async () => launchReturn(2, 3))
      })

      expect(colors).toHaveLength(3)
      colors.forEach((color) => expect(color).toBe(NEGATIVE))
    })

    it('sends credits out in the pool colour', async () => {
      render(<Harness />)

      const colors = await colorsLaunchedBy(() => vote(1))

      expect(colors.length).toBeGreaterThan(0)
      colors.forEach((color) => expect(color).toBe(AVAILABLE))
    })
  })
})
