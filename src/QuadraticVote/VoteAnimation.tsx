import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export type LaunchAnimationPayload =
  | {
      direction: 'toDiamond'
      // starting pool circle index to animate from
      poolStartIndex: number
      // destination diamond id
      diamondId: string | number
      // diamond level to target (1-based)
      diamondLevel: number
      // number of credits (circles) to animate
      count: number
      color?: string
    }
  | {
      direction: 'toPool'
      // starting pool circle index to animate to
      poolStartIndex: number
      // source diamond id
      diamondId: string | number
      // diamond level to animate from (1-based)
      diamondLevel: number
      // number of credits (circles) to animate
      count: number
      color?: string
    }

type Flight = {
  id: number
  direction: 'toDiamond' | 'toPool'
  poolIndex: number
  diamond: { id: string | number; level: number; ai: number }
  /** Colour worn for most of the trip. */
  color: string
  /** Colour adopted shortly before touchdown. Equal to `color` when unchanged. */
  landingColor: string
  startAt: number
  durationMs: number
  delayMs: number
}

const EASING = (t: number) => 1 - Math.pow(1 - t, 3)

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

type Rgb = [number, number, number]

const rgbCache = new Map<string, Rgb>()

/**
 * Colours reach us from several places — a `fill` attribute, a computed style, a
 * raw prop — so they can be hex, `rgb()`, or a keyword. Parsed once per colour
 * and cached, because the blend below runs per credit per frame.
 */
function toRgb(color: string): Rgb {
  const cached = rgbCache.get(color)
  if (cached) return cached

  let out: Rgb = [0, 0, 0]
  const hex = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  const fn = color.trim().match(/^rgba?\(([^)]+)\)$/i)

  if (hex) {
    const h = hex[1]
    const full = h.length === 3 ? h[0] + h[0] + h[1] + h[1] + h[2] + h[2] : h
    out = [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
    ]
  } else if (fn) {
    const parts = fn[1]
      .split(/[ ,/]+/)
      .filter(Boolean)
      .map(Number)
    out = [parts[0] || 0, parts[1] || 0, parts[2] || 0]
  } else if (typeof document !== 'undefined') {
    // Keywords such as `black`. Resolve through the browser once.
    const probe = document.createElement('span')
    probe.style.color = color
    document.body.appendChild(probe)
    const resolved = window.getComputedStyle(probe).color
    probe.remove()
    const m = resolved.match(/^rgba?\(([^)]+)\)$/i)
    if (m) {
      const parts = m[1]
        .split(/[ ,/]+/)
        .filter(Boolean)
        .map(Number)
      out = [parts[0] || 0, parts[1] || 0, parts[2] || 0]
    }
  }

  rgbCache.set(color, out)
  return out
}

function mixColors(from: string, to: string, amount: number) {
  if (amount <= 0) return from
  if (amount >= 1) return to
  const a = toRgb(from)
  const b = toRgb(to)
  const at = (i: number) => Math.round(a[i] + (b[i] - a[i]) * amount)
  return `rgb(${at(0)}, ${at(1)}, ${at(2)})`
}

/** Base time a single credit spends in flight. */
const FLIGHT_DURATION_MS = 650
/** A credit's source circle is cleared shortly after it sets off. */
const CLEAR_DELAY_MS = 150

/**
 * Credits move one at a time in both directions: the pool drains circle by
 * circle on the way out and refills circle by circle on the way back.
 *
 * A single vote can move 30+ credits, so the per-credit gap is squeezed to keep
 * the whole burst inside `STAGGER_WINDOW_MS` rather than dragging on for
 * seconds.
 */
const STAGGER_MS = 110
const STAGGER_WINDOW_MS = 900

function staggerFor(count: number) {
  if (count <= 1) return 0
  return Math.min(STAGGER_MS, STAGGER_WINDOW_MS / (count - 1))
}

/**
 * Fraction of the trip after which a credit takes on its landing colour, and how
 * long that cross-fade lasts. Applies to every pool.
 *
 * The fade must finish before the credit is removed at the end of its flight, or
 * it lands mid-blend: 0.5 * 650ms + 200ms = 525ms, comfortably inside 650ms.
 */
const LANDING_COLOR_AT = 0.5
const COLOR_FADE_MS = 200

/**
 * Where a credit starts and finishes taking on the pool's colour, as multiples
 * of the pool's influence radius. It ends outside the boundary so the credit has
 * already become liquid-coloured before it arrives, never during.
 */
const COLOR_FADE_FROM = 2.6
const COLOR_FADE_TO = 1.15

/**
 * A LiquidPool publishes the radius within which a credit counts as part of the
 * liquid. Inside it the credit hands its shape over to the pool's gooey layer,
 * which is the only place it can actually deform; outside it stays a plain
 * credit. Colour is not decided here — see `LANDING_COLOR_AT`.
 */
function getPoolInfluence(): { x: number; y: number; radius: number } | null {
  const pool = document.querySelector('[data-liquid-pool="true"][data-influence]')
  if (!pool) return null
  const radius = Number(pool.getAttribute('data-influence'))
  if (!Number.isFinite(radius) || radius <= 0) return null
  const rect = pool.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, radius }
}

function getNodeScreenRect(node: Element) {
  const bbox = node.getBoundingClientRect()
  return {
    x: bbox.left + bbox.width / 2,
    y: bbox.top + bbox.height / 2,
    r: Math.min(bbox.width, bbox.height) / 2,
  }
}

function getNodeColor(node: Element | null): string | null {
  if (!node) return null
  if (node instanceof SVGElement) {
    // Diamond paints through `style.fill` while Pool uses the `fill` attribute,
    // so read the computed value first and only then fall back to the attribute.
    const computed = window.getComputedStyle(node).fill
    if (computed && computed !== 'none') return computed
    return node.getAttribute('fill')
  }
  const style = window.getComputedStyle(node as HTMLElement)
  return style.backgroundColor || null
}

function getPoolCircleOrAnchor(poolIndex: number): Element | null {
  const poolCircle = document.getElementById(`pool-${poolIndex}`) as SVGCircleElement | null
  if (poolCircle) return poolCircle
  const anchor = document.getElementById('qv-pool-anchor')
  return anchor
}

/**
 * Pool fills from index 0, but with `reverse` it fills from the far end. The
 * launch payload always counts credits up from 0, so map that to the circle
 * that is really changing — otherwise a reversed pool animates the wrong end
 * and its circles never get held for the staggered drain.
 */
function toPoolCircleIndex(logicalIndex: number): number {
  const reversed = document.querySelector('svg[data-pool="true"][data-reverse="true"]')
  if (!reversed) return logicalIndex
  const total = reversed.querySelectorAll('circle').length
  if (!total) return logicalIndex
  return total - 1 - logicalIndex
}

/**
 * The colour a credit ends up as once it has settled back into the pool. Pool
 * and LiquidPool both declare it, so we do not have to guess which circle is
 * currently free — every circle in range is showing the spent colour mid-flight.
 */
function getPoolLandingColor(poolIndex: number): string | null {
  const pool = document.querySelector('[data-pool="true"]')
  const declared = pool?.getAttribute('data-circle-color')
  if (declared) return declared
  return getNodeColor(getPoolCircleOrAnchor(poolIndex))
}

function getDiamondLevelCircles(diamondId: string | number, level: number): SVGCircleElement[] {
  const svg = document.querySelector(`svg[data-diamond-id="${String(diamondId)}"]`)
  if (!svg) return []
  const nodeList = (svg as SVGSVGElement).querySelectorAll(
    `circle[data-level="${String(diamondId)}-${level}"]`,
  )
  const arr = Array.from(nodeList) as SVGCircleElement[]
  // sort by data-ai asc to make deterministic order
  arr.sort((a, b) => {
    const aiA = parseInt(a.getAttribute('data-ai') || '0', 10)
    const aiB = parseInt(b.getAttribute('data-ai') || '0', 10)
    return aiA - aiB
  })
  return arr
}

/**
 * The order in which freed circles refill the pool.
 *
 * - `first-out-last-in` — the circle that emptied first is the last to refill,
 *   so the pool drains and refills like a stack. This reads as the credits
 *   retracing their steps.
 * - `first-out-first-in` — the circle that emptied first refills first, so the
 *   block refills in the same direction it drained.
 */
export type ReturnOrder = 'first-out-last-in' | 'first-out-first-in'

export interface VoteAnimationProps {
  zIndex?: number
  /** @default 'first-out-last-in' */
  returnOrder?: ReturnOrder
}

const VoteAnimation: React.FC<VoteAnimationProps> = ({
  zIndex = 9999,
  returnOrder = 'first-out-last-in',
}) => {
  const [flights, setFlights] = useState<Flight[]>([])
  const counter = useRef(0)
  const rafRef = useRef<number | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  const ensureOverlay = useCallback(() => {
    if (!overlayRef.current) {
      let div = document.getElementById('animation-overlay') as HTMLDivElement | null
      if (!div) {
        div = document.createElement('div')
        div.id = 'animation-overlay'
        document.body.appendChild(div)
      }
      div.style.position = 'fixed'
      div.style.left = '0'
      div.style.top = '0'
      div.style.width = '100%'
      div.style.height = '100%'
      div.style.pointerEvents = 'none'
      div.style.zIndex = String(zIndex)
      overlayRef.current = div
    }
  }, [zIndex])

  const step = useCallback(() => {
    setFlights((prev) => {
      const now = performance.now()
      const remaining = prev.filter((f) => now < f.startAt + f.delayMs + f.durationMs)
      return remaining
    })
    rafRef.current = requestAnimationFrame(step)
  }, [])

  useEffect(() => {
    ensureOverlay()
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      overlayRef.current = null
    }
  }, [ensureOverlay, step])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<LaunchAnimationPayload>).detail
      if (!detail) return

      const now = performance.now()
      const count = Math.max(1, detail.count)
      const newFlights: Flight[] = []

      if (detail.direction === 'toDiamond') {
        const targets = getDiamondLevelCircles(detail.diamondId, detail.diamondLevel)
        const stagger = staggerFor(count)
        for (let i = 0; i < count; i++) {
          // Each credit leaves later than the last, so the pool drains gradually.
          const delayMs = i * stagger
          const poolIndex = toPoolCircleIndex(detail.poolStartIndex + i)
          const targetCircle = targets[i]
          if (!targetCircle) continue
          const ai = parseInt(targetCircle.getAttribute('data-ai') || '0', 10)
          const colorProbe = getPoolCircleOrAnchor(poolIndex)
          const outboundColor = detail.color ?? getNodeColor(colorProbe) ?? 'black'
          // announce start for this diamond circle
          window.dispatchEvent(
            new CustomEvent('qv:anim', {
              detail: {
                phase: 'start',
                direction: 'toDiamond',
                diamondId: detail.diamondId,
                diamondLevel: detail.diamondLevel,
                ai,
                poolIndex,
              },
            }),
          )
          newFlights.push({
            id: counter.current++,
            direction: 'toDiamond',
            poolIndex,
            diamond: { id: detail.diamondId, level: detail.diamondLevel, ai },
            color: outboundColor,
            landingColor: outboundColor,
            startAt: now,
            durationMs: FLIGHT_DURATION_MS,
            delayMs,
          })
          // Clear pool circle shortly after this credit departs.
          window.setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent('qv:anim-pool', {
                detail: {
                  phase: 'end',
                  direction: 'toDiamond',
                  poolIndex,
                },
              }),
            )
          }, CLEAR_DELAY_MS + delayMs)
          // schedule diamond arrival end announcement
          window.setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent('qv:anim-diamond', {
                detail: {
                  phase: 'end',
                  direction: 'toDiamond',
                  diamondId: detail.diamondId,
                  diamondLevel: detail.diamondLevel,
                  ai,
                },
              }),
            )
          }, delayMs + FLIGHT_DURATION_MS)
        }
      } else if (detail.direction === 'toPool') {
        const sources = getDiamondLevelCircles(detail.diamondId, detail.diamondLevel)
        const stagger = staggerFor(count)
        for (let i = 0; i < count; i++) {
          // Mirrors the outbound trip: one credit returns at a time.
          const delayMs = i * stagger
          // Credits left the pool in ascending index order, so filling the freed
          // block back to front makes the first circle out the last one in.
          const slot = returnOrder === 'first-out-last-in' ? count - 1 - i : i
          const poolIndex = toPoolCircleIndex(detail.poolStartIndex + slot)
          const diamondCircle = sources[i]
          if (!diamondCircle) continue
          const ai = parseInt(diamondCircle.getAttribute('data-ai') || '0', 10)
          // Probed before the start event triggers a re-render, so this is still
          // the vote colour the circle is showing right now.
          const departureColor = detail.color ?? getNodeColor(diamondCircle) ?? 'black'
          const arrivalColor = getPoolLandingColor(poolIndex) ?? departureColor
          // announce start for this diamond circle
          window.dispatchEvent(
            new CustomEvent('qv:anim', {
              detail: {
                phase: 'start',
                direction: 'toPool',
                diamondId: detail.diamondId,
                diamondLevel: detail.diamondLevel,
                ai,
                poolIndex,
              },
            }),
          )
          newFlights.push({
            id: counter.current++,
            direction: 'toPool',
            poolIndex,
            diamond: { id: detail.diamondId, level: detail.diamondLevel, ai },
            // Carries the vote colour home, turning into a pool credit at the end.
            color: departureColor,
            landingColor: arrivalColor,
            startAt: now,
            durationMs: FLIGHT_DURATION_MS,
            delayMs,
          })
          // Clear diamond circle shortly after this credit departs.
          window.setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent('qv:anim-diamond', {
                detail: {
                  phase: 'end',
                  direction: 'toPool',
                  diamondId: detail.diamondId,
                  diamondLevel: detail.diamondLevel,
                  ai,
                },
              }),
            )
          }, CLEAR_DELAY_MS + delayMs)
          // Pool arrival — staggered, so the pool refills circle by circle.
          window.setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent('qv:anim-pool', {
                detail: {
                  phase: 'end',
                  direction: 'toPool',
                  poolIndex,
                },
              }),
            )
          }, delayMs + FLIGHT_DURATION_MS)
        }
      }

      if (newFlights.length > 0) setFlights((prev) => [...prev, ...newFlights])
    }

    window.addEventListener('qv:launch-animation', handler as EventListener)
    return () => window.removeEventListener('qv:launch-animation', handler as EventListener)
  }, [returnOrder])

  const elements = useMemo(() => {
    const now = performance.now()
    return flights.map((f) => {
      const tRaw = (now - f.startAt - f.delayMs) / f.durationMs
      const t = Math.min(1, Math.max(0, tRaw))
      const eased = EASING(t)

      const poolEl = getPoolCircleOrAnchor(f.poolIndex)
      const diamondEl = document.querySelector(
        `svg[data-diamond-id="${String(f.diamond.id)}"] circle[data-level="${String(f.diamond.id)}-${f.diamond.level}"][data-ai="${f.diamond.ai}"]`,
      ) as SVGCircleElement | null

      let fromRect: { x: number; y: number; r: number }
      let toRect: { x: number; y: number; r: number }
      if (f.direction === 'toDiamond') {
        fromRect = poolEl ? getNodeScreenRect(poolEl) : { x: 0, y: 0, r: 4 }
        toRect = diamondEl ? getNodeScreenRect(diamondEl) : fromRect
      } else {
        fromRect = diamondEl ? getNodeScreenRect(diamondEl) : { x: 0, y: 0, r: 4 }
        toRect = poolEl ? getNodeScreenRect(poolEl) : fromRect
      }

      const x = fromRect.x + (toRect.x - fromRect.x) * eased
      const y = fromRect.y + (toRect.y - fromRect.y) * eased
      const r = fromRect.r
      const opacity = t < 0.1 ? t / 0.1 : 1

      const scale = t < 0.2 ? 0.8 + 0.2 * (t / 0.2) : 1
      // Droplet-like scaling: shrink a bit on extraction/absorption.
      let dropletScale = 1
      if (f.direction === 'toDiamond') {
        // pulled out of the pool: slightly bigger then smaller quickly
        if (t < 0.25) dropletScale = 1.15 - 0.35 * (t / 0.25)
      } else {
        // returning to pool: shrink as it merges at the end
        if (t > 0.7) dropletScale = 1 - 0.45 * ((t - 0.7) / 0.3)
      }
      const size = r * scale * dropletScale

      const influence = getPoolInfluence()
      let background: string
      let handover = 0

      if (influence) {
        const distance = Math.hypot(x - influence.x, y - influence.y)
        handover = 1 - clamp01(distance / influence.radius)

        // Blend by distance and finish *before* the boundary, so the credit is
        // already the colour of the liquid by the time it touches it.
        //
        // Timing cannot do this job. The easing is ease-out cubic, so at the
        // half-way point in time a credit has already covered ~87% of the
        // distance — it is deep inside the pool before a time-based fade has
        // even started. Interpolating per frame also means no CSS transition
        // trailing behind, which is what left a half-green ring on the liquid.
        const fadeFrom = influence.radius * COLOR_FADE_FROM
        const fadeTo = influence.radius * COLOR_FADE_TO
        const amount = clamp01((fadeFrom - distance) / Math.max(1, fadeFrom - fadeTo))
        background = mixColors(f.color, f.landingColor, amount)
      } else {
        // The grid Pool has no boundary, so fall back to switching half way.
        background = t >= LANDING_COLOR_AT ? f.landingColor : f.color
      }
      const style: React.CSSProperties = {
        position: 'fixed',
        left: `${x - size}px`,
        top: `${y - size}px`,
        width: `${size * 2}px`,
        height: `${size * 2}px`,
        borderRadius: '50%',
        background,
        // Inside the pool the liquid draws this credit instead, as a shape that
        // can stretch and merge. Drawing both would show a crisp circle riding
        // on top of the blob it is supposed to be melting into.
        opacity: handover > 0 ? opacity * (1 - clamp01(handover * 1.6)) : opacity,
        willChange: 'transform, left, top, opacity',
        // Against a LiquidPool the colour is already interpolated per frame, so
        // transitioning it as well would only add lag to a value that is exactly
        // right for where the credit is. The grid Pool switches abruptly at the
        // midpoint and still needs the smoothing.
        transition: influence
          ? 'opacity 120ms linear'
          : `opacity 120ms linear, background-color ${COLOR_FADE_MS}ms linear`,
        transform: 'translateZ(0)',
      }
      return <div key={f.id} style={style} />
    })
  }, [flights])

  // Render portal container if created
  if (!overlayRef.current) return null
  return createPortal(<>{elements}</>, overlayRef.current)
}

export default VoteAnimation
