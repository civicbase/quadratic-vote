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
  color: string
  startAt: number
  durationMs: number
  delayMs: number
}

const EASING = (t: number) => 1 - Math.pow(1 - t, 3)

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
  if (node instanceof SVGCircleElement) return node.getAttribute('fill')
  const style = window.getComputedStyle(node as HTMLElement)
  return style.backgroundColor || null
}

function getPoolCircleOrAnchor(poolIndex: number): Element | null {
  const poolCircle = document.getElementById(
    `pool-${poolIndex}`,
  ) as SVGCircleElement | null
  if (poolCircle) return poolCircle
  const anchor = document.getElementById('qv-pool-anchor')
  return anchor
}

function getDiamondLevelCircles(
  diamondId: string | number,
  level: number,
): SVGCircleElement[] {
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

export interface VoteAnimationProps {
  zIndex?: number
}

const VoteAnimation: React.FC<VoteAnimationProps> = ({ zIndex = 9999 }) => {
  const [flights, setFlights] = useState<Flight[]>([])
  const counter = useRef(0)
  const rafRef = useRef<number | null>(null)
  const overlayRef = useRef<HTMLDivElement | null>(null)

  const ensureOverlay = useCallback(() => {
    if (!overlayRef.current) {
      let div = document.getElementById(
        'animation-overlay',
      ) as HTMLDivElement | null
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
      const remaining = prev.filter(
        (f) => now < f.startAt + f.delayMs + f.durationMs,
      )
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
        const targets = getDiamondLevelCircles(
          detail.diamondId,
          detail.diamondLevel,
        )
        for (let i = 0; i < count; i++) {
          const poolIndex = detail.poolStartIndex + i
          const targetCircle = targets[i]
          if (!targetCircle) continue
          const ai = parseInt(targetCircle.getAttribute('data-ai') || '0', 10)
          const colorProbe = getPoolCircleOrAnchor(poolIndex)
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
            color: detail.color ?? getNodeColor(colorProbe) ?? 'black',
            startAt: now,
            durationMs: 650,
            delayMs: i * 60,
          })
          // Clear pool circle early (150ms after departure starts)
          window.setTimeout(
            () => {
              window.dispatchEvent(
                new CustomEvent('qv:anim-pool', {
                  detail: {
                    phase: 'end',
                    direction: 'toDiamond',
                    poolIndex,
                  },
                }),
              )
            },
            150 + i * 60,
          )
          // schedule diamond arrival end announcement
          window.setTimeout(
            () => {
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
            },
            650 + i * 60,
          )
        }
      } else if (detail.direction === 'toPool') {
        const sources = getDiamondLevelCircles(
          detail.diamondId,
          detail.diamondLevel,
        )
        for (let i = 0; i < count; i++) {
          const poolIndex = detail.poolStartIndex + i
          const diamondCircle = sources[i]
          if (!diamondCircle) continue
          const ai = parseInt(diamondCircle.getAttribute('data-ai') || '0', 10)
          const colorProbe = getPoolCircleOrAnchor(poolIndex)
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
            color: detail.color ?? getNodeColor(colorProbe) ?? 'black',
            startAt: now,
            durationMs: 650,
            delayMs: i * 60,
          })
          // Clear diamond circle early (150ms after departure starts)
          window.setTimeout(
            () => {
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
            },
            150 + i * 60,
          )
          // schedule pool arrival end announcement
          window.setTimeout(
            () => {
              window.dispatchEvent(
                new CustomEvent('qv:anim-pool', {
                  detail: {
                    phase: 'end',
                    direction: 'toPool',
                    poolIndex,
                  },
                }),
              )
            },
            650 + i * 60,
          )
        }
      }

      if (newFlights.length > 0) setFlights((prev) => [...prev, ...newFlights])
    }

    window.addEventListener('qv:launch-animation', handler as EventListener)
    return () =>
      window.removeEventListener(
        'qv:launch-animation',
        handler as EventListener,
      )
  }, [])

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
        fromRect = diamondEl
          ? getNodeScreenRect(diamondEl)
          : { x: 0, y: 0, r: 4 }
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
      const style: React.CSSProperties = {
        position: 'fixed',
        left: `${x - size}px`,
        top: `${y - size}px`,
        width: `${size * 2}px`,
        height: `${size * 2}px`,
        borderRadius: '50%',
        background: f.color,
        opacity,
        willChange: 'transform, left, top, opacity',
        transition: 'opacity 120ms linear',
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
