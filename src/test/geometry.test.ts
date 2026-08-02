import { describe, expect, it } from 'vitest'

import {
  COLOR_FADE_TO,
  influenceRadiusFor,
  outermostDropletReach,
  poolColorAmount,
  prunePending,
} from '../QuadraticVote/geometry'

/**
 * These are the relationships the liquid pool and the flying credits have to
 * agree on. Each one has broken in practice, and none of them is visible from
 * either component on its own.
 */
describe('liquid pool geometry', () => {
  const sizes: Array<[number, number]> = [
    [5, 58.8], // nearly dry, default spread
    [42, 58.8], // full, default spread
    [42, 0], // no spread at all
    [12, 160], // small blob, very wide spread
    [60, 20], // large blob, tight spread
  ]

  describe('influence radius', () => {
    it.each(sizes)(
      'reaches past the outermost droplet (radius %s, spread %s)',
      (radius, spreadPx) => {
        // A credit landing on the furthest droplet must already have crossed
        // into the liquid. When this stopped holding, credits flew to the outer
        // droplets without ever turning into liquid.
        expect(influenceRadiusFor(radius, spreadPx)).toBeGreaterThan(
          outermostDropletReach(radius, spreadPx),
        )
      },
    )

    it('shrinks with the pool rather than staying fixed', () => {
      expect(influenceRadiusFor(5, 58.8)).toBeLessThan(influenceRadiusFor(42, 58.8))
    })

    it('still has a reach when the blob has dried to nothing', () => {
      // Droplets are gone at this point, but a credit on its way home still
      // needs somewhere to be handed over.
      expect(influenceRadiusFor(0, 58.8)).toBeGreaterThan(0)
    })
  })

  describe('colour blend', () => {
    it.each([5, 42, 120])('is complete before the boundary (radius %s)', (radius) => {
      // The whole point: a credit is the colour of the liquid *before* it
      // touches it, never while sitting on it.
      expect(poolColorAmount(radius, radius)).toBe(1)
    })

    it('is complete slightly outside the boundary, not exactly on it', () => {
      // Landing the blend exactly on the boundary leaves no margin for a frame
      // that steps straight over it.
      expect(COLOR_FADE_TO).toBeGreaterThan(1)
      expect(poolColorAmount(100 * COLOR_FADE_TO, 100)).toBe(1)
    })

    it('leaves a credit its own colour while it is still far away', () => {
      expect(poolColorAmount(1000, 100)).toBe(0)
    })

    it('blends monotonically as the credit closes in', () => {
      // 115 is where the blend completes for a radius of 100 (COLOR_FADE_TO).
      const amounts = [400, 300, 250, 200, 150, 115].map((d) => poolColorAmount(d, 100))
      const sorted = [...amounts].sort((a, b) => a - b)
      expect(amounts).toEqual(sorted)
      expect(amounts[0]).toBeLessThan(1)
      expect(amounts[amounts.length - 1]).toBe(1)
    })
  })

  describe('pending arrivals', () => {
    it('forgets credits that never reported landing', () => {
      // One missed arrival used to hold the pool below its real level for good,
      // which dragged the influence radius down with it.
      const pending = new Map([
        [1, 0],
        [2, 900],
      ])

      prunePending(pending, 1000, 500)

      expect([...pending.keys()]).toEqual([2])
    })

    it('keeps credits that are still plausibly in flight', () => {
      const pending = new Map([[7, 800]])

      prunePending(pending, 1000, 500)

      expect(pending.has(7)).toBe(true)
    })

    it('drains completely once nothing can still be flying', () => {
      const pending = new Map([
        [1, 0],
        [2, 10],
        [3, 20],
      ])

      prunePending(pending, 5000, 2500)

      expect(pending.size).toBe(0)
    })
  })
})
