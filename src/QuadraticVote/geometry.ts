/**
 * Shared geometry for the liquid pool and the credits flying to and from it.
 *
 * These two components have to agree about where the pool ends. When the numbers
 * lived separately in each file they drifted apart twice: once leaving the
 * influence radius too small to reach the outer droplets, and once letting a
 * credit arrive still half its old colour. Keeping the relationships in one
 * place — and deriving one from another rather than tuning both — is what stops
 * that recurring.
 */

export function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

/** Droplet sizing, as a fraction of the main blob's radius. */
export const DROPLET_MIN_SCALE = 0.15
export const DROPLET_MAX_SCALE = 0.35
/** How far a droplet's orbit breathes in and out. */
export const ORBIT_BOB = 0.09
/** Widest orbit, as a fraction of `spreadPx`, before the bob is applied. */
export const MAX_ORBIT_SPAN = 1

/**
 * How far the outer edge of the furthest droplet can sit from the centre: the
 * widest orbit at the top of its bob, plus the radius of the largest droplet.
 */
export function outermostDropletReach(radius: number, spreadPx: number) {
  const furthestOrbit = radius + spreadPx * MAX_ORBIT_SPAN * (1 + ORBIT_BOB)
  return furthestOrbit + radius * DROPLET_MAX_SCALE
}

/** Clearance between the liquid's edge and the furthest droplet. */
const INFLUENCE_MARGIN = 1.12

/**
 * Distance from the centre within which a credit counts as part of the liquid.
 *
 * Derived from the droplet reach rather than tuned separately: a credit landing
 * on the outermost droplet has to have crossed into the liquid before it gets
 * there, and a second hand-tuned set of coefficients is exactly how that stopped
 * being true.
 */
export function influenceRadiusFor(radius: number, spreadPx: number) {
  return outermostDropletReach(radius, spreadPx) * INFLUENCE_MARGIN
}

/**
 * Where a credit starts and finishes taking on the pool's colour, as multiples
 * of the influence radius.
 */
export const COLOR_FADE_FROM = 2.6
export const COLOR_FADE_TO = 1.15

/**
 * How far a credit has turned into the pool's colour, from its distance to it.
 *
 * `COLOR_FADE_TO` is deliberately above 1, so this reaches 1 *outside* the
 * influence radius and a credit is fully liquid-coloured before it arrives
 * rather than while it sits there.
 *
 * Timing cannot do this job. The flight easing is ease-out cubic, so half way
 * through the duration a credit has already covered about 87% of the distance —
 * it is deep inside the pool before a time-based fade has even begun.
 */
export function poolColorAmount(distance: number, influenceRadius: number) {
  const from = influenceRadius * COLOR_FADE_FROM
  const to = influenceRadius * COLOR_FADE_TO
  return clamp01((from - distance) / Math.max(1, from - to))
}

/**
 * Forget credits that never reported landing. Without this a single missed
 * arrival holds the pool permanently below its real level, which also drags the
 * influence radius down with it.
 */
export function prunePending(pending: Map<number, number>, now: number, ttl: number) {
  for (const [index, stamp] of pending) {
    if (now - stamp > ttl) pending.delete(index)
  }
  return pending
}
