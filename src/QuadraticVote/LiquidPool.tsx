import React, { useEffect, useId, useMemo, useRef } from 'react'
import { useQuadraticVote } from '.'

export type LiquidPoolDirection = 'toDiamond' | 'toPool'

export interface LiquidPoolProps {
  /**
   * Reserved layout footprint in px (square). The liquid is free to drift past
   * this box — nothing is clipped — but surrounding layout only ever reserves
   * this much.
   * @default 120
   */
  size?: number

  /** Colour of the liquid. @default '#ffffff' */
  inkColor?: string

  /**
   * Number of satellite droplets when the pool is full. They disappear one by
   * one as credits are spent.
   * @default 6
   */
  droplets?: number

  /**
   * How far droplets orbit past the main blob, as a fraction of `size`.
   * @default 0.42
   */
  spread?: number

  /**
   * Irregularity of the main blob's outline: `0` is a clean circle, `1` is very
   * lumpy. The blob is built from overlapping lobes that the goo filter fuses,
   * so this is what stops it reading as a perfect circle.
   * @default 0.55
   */
  wobble?: number

  /** Seconds for one full drift cycle. Higher is slower. @default 14 */
  driftSeconds?: number

  /**
   * How readily the liquid fuses, as a fraction of the main blob's radius.
   * Higher joins shapes from further apart, but push it too far and the small
   * droplets dissolve before they can be seen — the goo threshold wipes out any
   * shape much smaller than the blur.
   * @default 0.16
   */
  viscosity?: number

  /**
   * Milliseconds for the liquid to settle after the credit count changes.
   * Governs how slowly the pool drains and refills.
   * @default 900
   */
  settleMs?: number
}

/** Lobes making up the main blob. Odd numbers avoid a symmetrical silhouette. */
const MAIN_LOBES = 5
/** Concurrent splash droplets. Fixed so the render never has to change shape. */
const BURST_SLOTS = 14
const BURST_MS = 780
/** Matches the old anchor: VoteAnimation sizes the flying credit from this box. */
const ANCHOR_PX = 10

type Burst = {
  active: boolean
  start: number
  direction: LiquidPoolDirection
  ux: number
  uy: number
  seed: number
}

/** Cheap deterministic noise, so every droplet drifts on its own rhythm. */
function noise(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function safeKeySuffix(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, '')
}

function getScreenCenter(el: Element) {
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

function getDiamondCircleEl(d: {
  diamondId?: string | number
  diamondLevel?: number
  ai?: number
}): SVGCircleElement | null {
  if (d.diamondId === undefined || d.diamondLevel === undefined || d.ai === undefined) return null
  return document.querySelector(
    `svg[data-diamond-id="${String(d.diamondId)}"] circle[data-level="${String(
      d.diamondId,
    )}-${d.diamondLevel}"][data-ai="${d.ai}"]`,
  )
}

/**
 * LiquidPool renders the credit budget as a floating drop of water with
 * satellite droplets around it, rather than a grid of circles.
 *
 * The blobs are plain SVG circles fused by a gooey filter (`feGaussianBlur`
 * feeding `feColorMatrix`, which pushes the blurred alpha back to a hard edge).
 * Because that works on the alpha channel it needs no opaque backdrop, and the
 * filter region extends well past the component box, so droplets and splashes
 * are never clipped.
 *
 * Motion is driven by a single rAF loop writing SVG attributes directly, so a
 * frame costs no React render. It idles while the tab is hidden and freezes for
 * `prefers-reduced-motion`.
 *
 * @example
 * ```tsx
 * <QuadraticVote.LiquidPool size={140} inkColor='#38BDF8' />
 * ```
 */
const LiquidPool: React.FC<LiquidPoolProps> = ({
  size = 120,
  inkColor = '#ffffff',
  droplets = 6,
  spread = 0.42,
  wobble = 0.55,
  driftSeconds = 14,
  viscosity = 0.16,
  settleMs = 900,
}) => {
  const { credits, availableCredits } = useQuadraticVote()

  const reactId = useId()
  const gooId = useMemo(() => `qv-goo-${safeKeySuffix(reactId)}`, [reactId])

  const dropletCount = Math.max(0, Math.floor(droplets))

  // The canvas is deliberately larger than the reserved box so orbiting
  // droplets and splashes have somewhere to go.
  const pad = Math.round(size * 0.85)
  const canvas = size + pad * 2
  const centre = canvas / 2

  /** Main blob radius at an empty and a full pool. */
  const minRadius = size * 0.07
  const maxRadius = size * 0.3
  const spreadPx = size * spread

  // Live containers rather than arrays of element refs: `children` always
  // reflects the DOM React currently owns, so a remount cannot leave the loop
  // animating detached elements while the visible ones sit frozen.
  const gRef = useRef<SVGGElement | null>(null)
  const anchorsRef = useRef<HTMLDivElement | null>(null)
  const blurRef = useRef<SVGFEGaussianBlurElement | null>(null)
  /**
   * Animation time, accumulated from clamped frame deltas. Splashes are stamped
   * and measured against this rather than a wall clock: it never jumps, so a
   * throttled or backgrounded tab pauses a splash instead of expiring it before
   * it can be drawn.
   */
  const clock = useRef(0)

  const bursts = useRef<Burst[]>(
    Array.from({ length: BURST_SLOTS }, () => ({
      active: false,
      start: 0,
      direction: 'toDiamond' as LiquidPoolDirection,
      ux: 0,
      uy: 0,
      seed: 0,
    })),
  )
  const nextBurst = useRef(0)
  const boxRef = useRef<HTMLDivElement | null>(null)

  /** Target fill, read by the loop without restarting it. */
  const fillTarget = useRef(1)
  fillTarget.current = credits > 0 ? clamp01(availableCredits / credits) : 0

  const config = useRef({
    minRadius,
    maxRadius,
    spreadPx,
    wobble,
    driftSeconds,
    settleMs,
    viscosity,
    centre,
    dropletCount,
  })
  config.current = {
    minRadius,
    maxRadius,
    spreadPx,
    wobble,
    driftSeconds,
    settleMs,
    viscosity,
    centre,
    dropletCount,
  }

  /**
   * Which part of the liquid each credit flies to and from.
   *
   * A credit is tied to whatever visibly changes when it moves. Most of them
   * only make the main blob a little bigger or smaller, so they use the main
   * blob. But a handful sit exactly on the threshold where a droplet appears or
   * dries up — those use that droplet, so a returning credit lands on the spot
   * the new droplet forms at rather than flying to the centre while the droplet
   * pops up somewhere else.
   *
   * Droplet `k` is present once `dropletCount * fill > k`, and a credit at pool
   * index `p` leaves the pool holding `credits - p` available, so the crossing
   * happens at `p = credits - credits * (k + 0.5) / dropletCount`.
   *
   * Anchors live inside the group they belong to, so they track it for free.
   */
  const anchorGroups = useMemo(() => {
    const groups: number[][] = Array.from({ length: dropletCount + 1 }, () => [])

    const dropletForIndex = new Map<number, number>()
    for (let k = 0; k < dropletCount; k++) {
      const availableWhenAppearing = (credits * (k + 0.5)) / dropletCount
      const index = Math.round(credits - availableWhenAppearing)
      const clamped = Math.min(credits - 1, Math.max(0, index))
      // Two droplets can round onto the same credit when there are more
      // droplets than credits; first one wins, the other keeps the main blob.
      if (!dropletForIndex.has(clamped)) dropletForIndex.set(clamped, k)
    }

    for (let i = 0; i < credits; i++) {
      const droplet = dropletForIndex.get(i)
      groups[droplet === undefined ? 0 : droplet + 1].push(i)
    }
    return groups
  }, [credits, dropletCount])

  useEffect(() => {
    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let raf = 0
    let last = performance.now()
    let radius = config.current.minRadius
    let elapsed = 0

    const frame = (now: number) => {
      // Clamp to a sane positive delta. A negative one (clock skew, a tab
      // resuming, a timestamp from a different clock than performance.now())
      // would flip the smoothing factor negative and send the radius diverging
      // away from its target instead of easing toward it.
      const dtMs = Math.min(64, Math.max(0, now - last))
      last = now
      if (!prefersReduced) elapsed += dtMs
      // Splashes advance even under reduced motion — they are a direct response
      // to the user's vote, not ambient movement.
      clock.current += dtMs

      const {
        minRadius,
        maxRadius,
        spreadPx,
        wobble,
        driftSeconds,
        settleMs,
        viscosity,
        centre,
        dropletCount,
      } = config.current

      const g = gRef.current
      const circles = g ? (g.children as unknown as SVGCircleElement[]) : null
      const anchorEls = anchorsRef.current
        ? (anchorsRef.current.children as unknown as HTMLElement[])
        : null
      const fill = fillTarget.current
      const t = elapsed / 1000
      const drift = (Math.PI * 2) / Math.max(1, driftSeconds)

      // Ease the radius toward its target so spending credits reads as the
      // liquid draining rather than the blob snapping to a new size.
      const target = fill <= 0 ? 0 : minRadius + (maxRadius - minRadius) * Math.sqrt(fill)
      const k = 1 - Math.exp(-dtMs / Math.max(1, settleMs / 4))
      radius += (target - radius) * k

      // Scale the goo with the pool. A fixed blur would dissolve the droplets
      // as the blob shrinks, and eventually the blob itself.
      if (blurRef.current) {
        blurRef.current.setAttribute('stdDeviation', String(Math.max(1.2, radius * viscosity)))
      }

      // --- main blob: overlapping lobes the filter fuses into one drop ---
      const lobeSpin = t * drift * 0.35
      for (let j = 0; j < MAIN_LOBES; j++) {
        const el = circles ? circles[j] : null
        if (!el) continue
        if (j === 0) {
          // Central lobe keeps the drop solid whatever the others do.
          el.setAttribute('cx', String(centre))
          el.setAttribute('cy', String(centre))
          el.setAttribute('r', String(Math.max(0, radius * 0.86)))
          continue
        }
        const seedA = noise(j, 1)
        const seedB = noise(j, 2)
        const angle = (j / (MAIN_LOBES - 1)) * Math.PI * 2 + lobeSpin
        const offset =
          radius * wobble * 0.42 * (0.55 + 0.45 * Math.sin(t * drift * (1 + seedA) + seedA * 6.3))
        const lobeR = radius * (0.62 + 0.16 * Math.sin(t * drift * (1.3 + seedB) + seedB * 6.3))
        el.setAttribute('cx', String(centre + Math.cos(angle) * offset))
        el.setAttribute('cy', String(centre + Math.sin(angle) * offset))
        el.setAttribute('r', String(Math.max(0, lobeR)))
      }

      // --- satellite droplets ---
      // Fractional activation means they dry out one at a time instead of all
      // vanishing together.
      const active = dropletCount * fill
      for (let k2 = 0; k2 < dropletCount; k2++) {
        const el = circles ? circles[MAIN_LOBES + k2] : null
        const anchor = anchorEls ? anchorEls[k2 + 1] : null
        const frac = dropletCount > 1 ? k2 / (dropletCount - 1) : 0
        const seedA = noise(k2, 3)
        const seedB = noise(k2, 4)
        const seedC = noise(k2, 5)

        const presence = clamp01(active - k2)
        // 15%–35% of the main blob, varied per droplet.
        const satR = radius * (0.15 + 0.2 * frac) * presence
        const dir = seedC > 0.5 ? 1 : -1
        const angle = seedA * Math.PI * 2 + t * drift * (0.35 + 0.5 * seedB) * dir
        const orbit =
          radius +
          spreadPx * (0.3 + 0.7 * frac) * (1 + 0.09 * Math.sin(t * drift * 1.7 + seedB * 6.3))
        const cx = centre + Math.cos(angle) * orbit
        const cy = centre + Math.sin(angle) * orbit

        if (el) {
          el.setAttribute('cx', String(cx))
          el.setAttribute('cy', String(cy))
          el.setAttribute('r', String(Math.max(0, satR)))
        }
        // The anchor holds its orbit even while the droplet is dried up, so a
        // returning credit flies to the point the droplet is about to form at
        // and the two meet. Parking it on the main blob instead would send the
        // credit to the centre and pop the droplet up somewhere else.
        if (anchor) {
          anchor.style.transform = `translate(${cx - ANCHOR_PX / 2}px, ${cy - ANCHOR_PX / 2}px)`
        }
      }

      const mainAnchor = anchorEls ? anchorEls[0] : null
      if (mainAnchor) {
        mainAnchor.style.transform = `translate(${centre - ANCHOR_PX / 2}px, ${centre - ANCHOR_PX / 2}px)`
      }

      // --- splashes ---
      for (let b = 0; b < BURST_SLOTS; b++) {
        const el = circles ? circles[MAIN_LOBES + dropletCount + b] : null
        const burst = bursts.current[b]
        if (!el) continue
        if (!burst.active) {
          el.setAttribute('r', '0')
          continue
        }
        const p = clamp01((clock.current - burst.start) / BURST_MS)
        if (p >= 1) {
          burst.active = false
          el.setAttribute('r', '0')
          continue
        }
        // Outbound throws a droplet away from the pool; inbound brings one back
        // in and lets it merge.
        const travel = burst.direction === 'toDiamond' ? p : 1 - p
        const eased = 1 - Math.pow(1 - travel, 2)
        const dist = radius * 0.85 + eased * (radius * 1.5 + spreadPx * 0.5)
        const wob = (burst.seed - 0.5) * 0.5
        const ux = burst.ux * Math.cos(wob) - burst.uy * Math.sin(wob)
        const uy = burst.ux * Math.sin(wob) + burst.uy * Math.cos(wob)
        const shrink = burst.direction === 'toDiamond' ? 1 - p : p
        el.setAttribute('cx', String(centre + ux * dist))
        el.setAttribute('cy', String(centre + uy * dist))
        el.setAttribute('r', String(Math.max(0, radius * 0.26 * (0.4 + 0.6 * shrink))))
      }

      raf = requestAnimationFrame(safeFrame)
    }

    // Keep the loop alive whatever a single frame does: rescheduling only at
    // the end of `frame` means one thrown error would freeze the pool for good.
    const safeFrame = (now: number) => {
      try {
        frame(now)
      } catch {
        raf = requestAnimationFrame(safeFrame)
      }
    }

    raf = requestAnimationFrame(safeFrame)

    const onVisibility = () => {
      // Skip the gap so the blob does not lurch after the tab comes back.
      last = performance.now()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (!detail || detail.phase !== 'start') return

      // Aim the splash at the diamond the credit is travelling to, so the
      // liquid detaches on the side that faces it.
      let ux = 0
      let uy = -1
      const poolEl = boxRef.current
      const diamondEl = getDiamondCircleEl(detail)
      if (poolEl && diamondEl) {
        const from = getScreenCenter(poolEl)
        const to = getScreenCenter(diamondEl)
        const dx = to.x - from.x
        const dy = to.y - from.y
        const mag = Math.hypot(dx, dy) || 1
        ux = dx / mag
        uy = dy / mag
      }

      const slot = bursts.current[nextBurst.current % BURST_SLOTS]
      nextBurst.current += 1
      slot.active = true
      slot.start = clock.current
      slot.direction = detail.direction
      slot.ux = ux
      slot.uy = uy
      slot.seed = noise(nextBurst.current, 7)
    }

    window.addEventListener('qv:anim', handler as EventListener)
    return () => window.removeEventListener('qv:anim', handler as EventListener)
  }, [])

  const blurStd = Math.max(1.2, maxRadius * viscosity)

  const anchorStyle: React.CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: ANCHOR_PX,
    height: ANCHOR_PX,
    borderRadius: '50%',
    background: inkColor,
    opacity: 0,
    pointerEvents: 'none',
  }

  return (
    <div
      ref={boxRef}
      data-pool='true'
      data-liquid-pool='true'
      data-circle-color={inkColor}
      style={{ position: 'relative', width: size, height: size, pointerEvents: 'none' }}
    >
      <svg
        width={canvas}
        height={canvas}
        viewBox={`0 0 ${canvas} ${canvas}`}
        aria-hidden='true'
        style={{ position: 'absolute', left: -pad, top: -pad, overflow: 'visible' }}
      >
        <defs>
          {/*
            feGaussianBlur smears neighbouring shapes together; feColorMatrix
            then multiplies the alpha and subtracts a constant, snapping that
            blur back to a hard edge wherever it crossed the threshold. The
            SourceGraphic is deliberately not blended back on top — showing the
            crisp circles would give the individual blobs away.
          */}
          <filter
            id={gooId}
            filterUnits='userSpaceOnUse'
            x={0}
            y={0}
            width={canvas}
            height={canvas}
            colorInterpolationFilters='sRGB'
          >
            <feGaussianBlur ref={blurRef} in='SourceGraphic' stdDeviation={blurStd} result='blur' />
            <feColorMatrix
              in='blur'
              type='matrix'
              values='1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7'
            />
          </filter>
        </defs>

        <g ref={gRef} filter={`url(#${gooId})`} fill={inkColor}>
          {Array.from({ length: MAIN_LOBES }, (_, i) => (
            <circle key={`lobe-${i}`} cx={centre} cy={centre} r={0} />
          ))}
          {Array.from({ length: dropletCount }, (_, i) => (
            <circle key={`sat-${i}`} cx={centre} cy={centre} r={0} />
          ))}
          {Array.from({ length: BURST_SLOTS }, (_, i) => (
            <circle key={`burst-${i}`} cx={centre} cy={centre} r={0} />
          ))}
        </g>
      </svg>

      {/* Flight anchors. VoteAnimation looks these up by id and measures them,
          so they are sized but invisible. */}
      <div
        ref={anchorsRef}
        style={{
          position: 'absolute',
          left: -pad,
          top: -pad,
          width: canvas,
          height: canvas,
          pointerEvents: 'none',
        }}
      >
        {anchorGroups.map((indices, group) => (
          <span
            key={`group-${group}`}
            style={{ position: 'absolute', left: 0, top: 0, width: 0, height: 0 }}
          >
            {group === 0 && <span id='qv-pool-anchor' style={anchorStyle} />}
            {indices.map((index) => (
              <span key={index} id={`pool-${index}`} style={anchorStyle} />
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

export default LiquidPool
