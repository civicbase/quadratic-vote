import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuadraticVote } from '.'

export type LiquidPoolDirection = 'toDiamond' | 'toPool'
export type LiquidPoolShape = 'circle' | 'rect'
export type LiquidPoolCoreScaleMode = 'available' | 'used'

export interface LiquidPoolProps {
  /**
   * Matches the CodePen animation (gooey/blur + contrast) inside a compact container.
   * @default 'circle'
   */
  shape?: LiquidPoolShape

  /** Size in px when `shape="circle"` @default 96 */
  size?: number

  /** Width in px when `shape="rect"` @default 140 */
  width?: number

  /** Height in px when `shape="rect"` @default 140 */
  height?: number

  /** Background color behind the gooey blobs @default '#000' */
  backgroundColor?: string

  /** Blob/droplet color (CodePen uses white) @default '#fff' */
  inkColor?: string

  /** Blur amount in px (CodePen uses 8) @default 8 */
  blurPx?: number

  /** Contrast multiplier (CodePen uses 18) @default 18 */
  contrast?: number

  /**
   * CSS `mix-blend-mode` for the gooey layer.
   * - CodePen uses `screen` which can create halos on transparent/light backgrounds.
   * - Use `'normal'` for a “normal” look.
   * @default 'screen'
   */
  mixBlendMode?: React.CSSProperties['mixBlendMode']

  /**
   * Scale of the liquid/goo content inside the container (does NOT change the container size).
   * - `1` = default size
   * - `0.8` = smaller liquid inside same container
   * - `1.2` = bigger liquid inside same container
   * @default 1
   */
  liquidScale?: number

  /**
   * Multiplier for how many extra “splash” droplets to spawn per credit.
   * - `1` means: 1 credit = 1 droplet (recommended for syncing)
   * - `2` means: 1 credit = 2 droplets (more dramatic)
   * @default 1
   */
  burstCount?: number

  /**
   * When `availableCredits === 0`, the pool will "dry out" (animate) and then become blank.
   * This controls how long the dry-out animation lasts before switching to blank.
   * Set to `0` to become blank immediately.
   * @default 0
   */
  dryOutMs?: number

  /**
   * Which credit count should drive the core blob size.
   * @default 'available'
   */
  coreScaleMode?: LiquidPoolCoreScaleMode

  /**
   * Minimum scale applied to the core blob (when the ratio is 0).
   * @default 0.6
   */
  coreScaleMin?: number

  /**
   * Maximum scale applied to the core blob (when the ratio is 1).
   * @default 1
   */
  coreScaleMax?: number
}

type BurstDrop = {
  id: number
  direction: LiquidPoolDirection
  seed: number
  vx: number
  vy: number
}

type LaunchPayload = {
  direction: LiquidPoolDirection
  count: number
}

type AnimStartPayload = {
  phase: 'start'
  direction: LiquidPoolDirection
  poolIndex?: number
  diamondId?: string | number
  diamondLevel?: number
  ai?: number
}

type AnimEndPayload = {
  phase: 'end'
  direction: LiquidPoolDirection
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function clampInt(n: number, min: number, max: number) {
  const x = Math.trunc(n)
  return Math.max(min, Math.min(max, x))
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
  const selector = `svg[data-diamond-id="${String(d.diamondId)}"] circle[data-level="${String(
    d.diamondId,
  )}-${d.diamondLevel}"][data-ai="${d.ai}"]`
  return document.querySelector(selector) as SVGCircleElement | null
}

const LiquidPool: React.FC<LiquidPoolProps> = ({
  shape = 'circle',
  size = 96,
  width = 140,
  height = 140,
  backgroundColor = '#000',
  inkColor = '#fff',
  blurPx = 8,
  contrast = 18,
  mixBlendMode = 'screen',
  liquidScale = 1,
  burstCount = 1,
  dryOutMs = 0,
  coreScaleMode = 'available',
  coreScaleMin = 0.6,
  coreScaleMax = 1,
}) => {
  const { credits, availableCredits } = useQuadraticVote()
  const mainRef = useRef<HTMLElement | null>(null)
  const lastVectorRef = useRef<{ vx: number; vy: number } | null>(null)

  // We keep a stable ID so injected CSS + keyframes don't collide across multiple instances.
  const reactId = useId()
  const scope = useMemo(() => `qv-liquidpool-${safeKeySuffix(reactId)}`, [reactId])
  const keySuffix = useMemo(() => safeKeySuffix(reactId) || 'qv', [reactId])

  const w = shape === 'circle' ? size : width
  const h = shape === 'circle' ? size : height
  const radius = shape === 'circle' ? '9999px' : '12px'

  // Visual "credits in pool".
  // - Decrements when a credit leaves the pool (qv:anim-pool end, toDiamond) => shrink while credits depart.
  // - Increments when a credit arrives back (qv:anim-pool end, toPool) => grow as credits return.
  //
  // This is intentionally NOT tied directly to availableCredits (which updates immediately),
  // because we want visuals to follow the animation timeline.
  const [displayedAvailableCredits, setDisplayedAvailableCredits] = useState<number>(
    clampInt(availableCredits, 0, credits),
  )
  const lockUntilRef = useRef<number>(0)

  // Track in-flight credits leaving the pool, so we only blank once the last departing credit finishes.
  const [inFlightToDiamond, setInFlightToDiamond] = useState(0)
  const [inFlightToPool, setInFlightToPool] = useState(0)

  const [dryState, setDryState] = useState<'wet' | 'drying' | 'dry'>('wet')
  const dryTimerRef = useRef<number | null>(null)

  const displayedUsedCredits = credits - displayedAvailableCredits
  const coreRatio =
    credits > 0
      ? clamp01(
          (coreScaleMode === 'available' ? displayedAvailableCredits : displayedUsedCredits) /
            credits,
        )
      : 0
  const coreScaleTarget =
    clamp01(coreScaleMin) + (clamp01(coreScaleMax) - clamp01(coreScaleMin)) * coreRatio
  // IMPORTANT: "empty state" must react to the real source of truth: availableCredits.
  // If availableCredits is 0, the pool should look empty (scale to 0 / blank),
  // even if our animation-synced `displayedAvailableCredits` is still catching up.
  const isLogicallyEmpty = availableCredits <= 0

  // Pool "liquid mass" should track remaining credits in the pool (available),
  // but clamp to empty immediately when availableCredits is 0.
  const mass = isLogicallyEmpty ? 0 : credits > 0 ? clamp01(displayedAvailableCredits / credits) : 0

  // Core should visually drain fully when empty.
  const coreScale = isLogicallyEmpty ? 0 : coreScaleTarget
  const liquidScaleClamped = Math.max(0.01, Number.isFinite(liquidScale) ? liquidScale : 1)

  // Core scaling is now handled by Framer Motion (spring), for more organic behavior.

  // Keep displayed credits in sync when we're not in an animation window (e.g. reset()).
  useEffect(() => {
    const now = performance.now()
    if (now >= lockUntilRef.current) {
      setDisplayedAvailableCredits(clampInt(availableCredits, 0, credits))
    }
  }, [availableCredits, credits])

  // Lock out immediate "jump to final value" when an animation starts,
  // and instead update displayed credits per-credit when pool events end.
  useEffect(() => {
    const onLaunch = (e: Event) => {
      const d = (e as CustomEvent<LaunchPayload>).detail
      if (!d) return
      const count = Math.max(1, Math.trunc(d.count))
      const now = performance.now()
      // We lock for slightly longer than the whole flight window (staggered).
      const lockMs = 750 + (count - 1) * 60
      lockUntilRef.current = Math.max(lockUntilRef.current, now + lockMs)
      // After lock expires, hard sync to correct any drift.
      window.setTimeout(() => {
        if (performance.now() >= lockUntilRef.current) {
          setDisplayedAvailableCredits(clampInt(availableCredits, 0, credits))
        }
      }, lockMs + 20)
    }

    const onPoolEnd = (e: Event) => {
      const ce = e as CustomEvent<{
        phase: 'end'
        direction: LiquidPoolDirection
      }>
      const d = ce.detail
      if (!d || d.phase !== 'end') return

      setDisplayedAvailableCredits((prev) => {
        // qv:anim-pool end:
        // - toDiamond: pool dot cleared (credit visually leaves pool) => decrement now
        // - toPool: pool dot filled (credit arrives) => increment now
        const delta = d.direction === 'toPool' ? 1 : -1
        return clampInt(prev + delta, 0, credits)
      })

      // For returns, decrement in-flight when the credit actually arrives at the pool.
      if (d.direction === 'toPool') setInFlightToPool((prev) => Math.max(0, prev - 1))
    }

    const onAnimStart = (e: Event) => {
      const d = (e as CustomEvent<AnimStartPayload>).detail
      if (!d || d.phase !== 'start') return
      if (d.direction === 'toDiamond') setInFlightToDiamond((prev) => prev + 1)
      if (d.direction === 'toPool') setInFlightToPool((prev) => prev + 1)

      // Capture a "current stream direction" for the continuous spout churn.
      const poolEl = mainRef.current
      const diamondEl = getDiamondCircleEl(d)
      if (poolEl && diamondEl) {
        const p = getScreenCenter(poolEl)
        const t = getScreenCenter(diamondEl)
        lastVectorRef.current = { vx: t.x - p.x, vy: t.y - p.y }
      }
    }

    const onDiamondEnd = (e: Event) => {
      const d = (e as CustomEvent<AnimEndPayload>).detail
      if (!d || d.phase !== 'end') return
      if (d.direction === 'toDiamond') setInFlightToDiamond((prev) => Math.max(0, prev - 1))
    }

    window.addEventListener('qv:launch-animation', onLaunch as EventListener)
    window.addEventListener('qv:anim', onAnimStart as EventListener)
    window.addEventListener('qv:anim-pool', onPoolEnd as EventListener)
    window.addEventListener('qv:anim-diamond', onDiamondEnd as EventListener)
    return () => {
      window.removeEventListener('qv:launch-animation', onLaunch as EventListener)
      window.removeEventListener('qv:anim', onAnimStart as EventListener)
      window.removeEventListener('qv:anim-pool', onPoolEnd as EventListener)
      window.removeEventListener('qv:anim-diamond', onDiamondEnd as EventListener)
    }
  }, [availableCredits, credits])

  useEffect(() => {
    // "Empty state" should be stable and never flicker:
    // if availableCredits is 0, we are empty (optionally after dryOutMs).
    // This avoids transient flashes caused by animation-synced counters settling.
    if (dryTimerRef.current) {
      window.clearTimeout(dryTimerRef.current)
      dryTimerRef.current = null
    }

    const ms = Math.max(0, dryOutMs)

    if (availableCredits > 0) {
      setDryState('wet')
      return
    }

    if (ms === 0) {
      setDryState('dry')
      return
    }

    setDryState('drying')
    dryTimerRef.current = window.setTimeout(() => setDryState('dry'), ms)

    return () => {
      if (dryTimerRef.current) {
        window.clearTimeout(dryTimerRef.current)
        dryTimerRef.current = null
      }
    }
  }, [availableCredits, dryOutMs])

  const cssText = useMemo(() => {
    // This is a faithful translation of the CodePen CSS, scoped to this component only.
    // Also adds a small "burst" droplet animation (triggered by qv:anim events).
    const spin1 = `qv-spin-1-${keySuffix}`
    const spin2 = `qv-spin-2-${keySuffix}`
    const spin3 = `qv-spin-3-${keySuffix}`
    const spin4 = `qv-spin-4-${keySuffix}`
    const spin5 = `qv-spin-5-${keySuffix}`
    const spin6 = `qv-spin-6-${keySuffix}`
    const dropOut = `qv-drop-out-${keySuffix}`
    const dropIn = `qv-drop-in-${keySuffix}`

    return `
.${scope} {
  position: relative;
  background: var(--qv-liquid-bg);
  width: var(--qv-liquid-w);
  height: var(--qv-liquid-h);
  border-radius: var(--qv-liquid-radius);
  overflow: hidden;
  /* Prevent filter halo from bleeding outside the pool boundary on transparent backgrounds */
  clip-path: inset(0 round var(--qv-liquid-radius));
  /* Keep blend effects contained to this element */
  isolation: isolate;
}

/* Gooey layer: filter/blend applies ONLY to blobs, not the background */
.${scope} .qv-liquidpool__goo {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  filter: blur(var(--qv-liquid-blur)) contrast(var(--qv-liquid-contrast));
  mix-blend-mode: var(--qv-liquid-blend);
  transform: scale(var(--qv-liquid-scale));
  transform-origin: center;
  pointer-events: none;
}

/* Dry-out: fade/shrink blobs while their animations keep running, then blank */
.${scope}.qv-liquidpool--drying .qv-liquidpool__goo > div,
.${scope}.qv-liquidpool--drying .qv-liquidpool__goo > span:nth-of-type(-n + 5),
.${scope}.qv-liquidpool--drying .qv-liquidpool__goo > span.qv-liquidpool__burst {
  opacity: 0;
  transition: opacity var(--qv-dry-ms) ease-in;
}

.${scope}.qv-liquidpool--drying .qv-liquidpool__goo > div {
  transform: scale(0.01);
  transition:
    opacity var(--qv-dry-ms) ease-in,
    transform var(--qv-dry-ms) ease-in;
}

.${scope}.qv-liquidpool--dry .qv-liquidpool__goo > div,
.${scope}.qv-liquidpool--dry .qv-liquidpool__goo > span:nth-of-type(-n + 5),
.${scope}.qv-liquidpool--dry .qv-liquidpool__goo > span.qv-liquidpool__burst {
  opacity: 0;
}

/* Orbiting droplets (CodePen: main > span) */
.${scope} .qv-liquidpool__goo > span {
  position: absolute;
}

.${scope} .qv-liquidpool__goo > span:nth-of-type(1) {
  left: 50%;
  width: 150px;
  height: 150px;
  animation: ${spin3} 8s ease-in-out infinite forwards;
}
.${scope} .qv-liquidpool__goo > span:nth-of-type(1) > span { width: 30px; }

.${scope} .qv-liquidpool__goo > span:nth-of-type(2) {
  left: 20%;
  width: 150px;
  height: 100px;
  animation: ${spin4} 6s ease-in-out infinite;
}
.${scope} .qv-liquidpool__goo > span:nth-of-type(2) > span { width: 21px; }

.${scope} .qv-liquidpool__goo > span:nth-of-type(3) {
  left: 48%;
  top: 48%;
  width: 100px;
  height: 100px;
  animation: ${spin5} 3.5s ease-in-out infinite forwards;
}
.${scope} .qv-liquidpool__goo > span:nth-of-type(3) > span { width: 25px; }

.${scope} .qv-liquidpool__goo > span:nth-of-type(4) {
  left: 28%;
  top: 48%;
  width: 200px;
  height: 200px;
  animation: ${spin2} 4.5s ease-in-out infinite forwards;
}
.${scope} .qv-liquidpool__goo > span:nth-of-type(4) > span { width: 20px; }

.${scope} .qv-liquidpool__goo > span:nth-of-type(5) {
  left: 50%;
  top: 25%;
  width: 200px;
  height: 200px;
  animation: ${spin6} 3.5s ease-in-out infinite forwards;
}
.${scope} .qv-liquidpool__goo > span:nth-of-type(5) > span { width: 20px; }

.${scope} .qv-liquidpool__goo > span > span {
  position: absolute;
  background: var(--qv-liquid-ink);
  right: 20px;
  top: 20px;
  aspect-ratio: 1;
  border-radius: 50%;
  transform: scale(calc(var(--qv-mass)));
  transform-origin: center;
  opacity: calc(var(--qv-mass));
}

/* Core blob (CodePen: div and nested divs) */
.${scope} .qv-liquidpool__goo div {
  position: relative;
  width: 80px;
  aspect-ratio: 1;
  background: var(--qv-liquid-ink);
  border-radius: 50%;
}

.${scope} .qv-liquidpool__goo div > div {
  position: absolute;
  aspect-ratio: 1;
  border-radius: 50%;
  background: transparent;
}

.${scope} .qv-liquidpool__goo div > div > span {
  position: absolute;
  aspect-ratio: 1;
  background: var(--qv-liquid-ink);
  border-radius: 50%;
}

.${scope} .qv-liquidpool__goo div > div:nth-child(1) {
  left: -5px;
  width: 70px;
  animation: ${spin1} 5s ease-in infinite forwards;
}
.${scope} .qv-liquidpool__goo div > div:nth-child(1) > span { width: 50px; }

.${scope} .qv-liquidpool__goo div > div:nth-child(2) {
  left: 10px;
  bottom: 0;
  width: 80px;
  animation: ${spin2} 3s ease-in 1.5s infinite forwards;
}
.${scope} .qv-liquidpool__goo div > div:nth-child(2) > span { width: 60px; }

/* Event droplets burst */
.${scope} .qv-liquidpool__goo .qv-liquidpool__burst {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 0;
  height: 0;
  transform: translate(-50%, -50%);
  pointer-events: none;
  overflow: visible;
}

.${scope} .qv-liquidpool__goo .qv-liquidpool__drop {
  position: absolute;
  left: 0;
  top: 0;
  /* width/height/transform are driven by Framer Motion */
}

.${scope} .qv-liquidpool__goo .qv-liquidpool__drop > span {
  position: absolute;
  right: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: var(--qv-liquid-ink);
  border-radius: 50%;
}

.${scope} .qv-liquidpool__goo .qv-liquidpool__drop.qv-out {
  animation: none;
}
.${scope} .qv-liquidpool__goo .qv-liquidpool__drop.qv-in {
  animation: none;
}

.${scope} .qv-liquidpool__goo .qv-liquidpool__tether {
  position: absolute;
  left: 0;
  top: 0;
  width: 14px;
  background: var(--qv-liquid-ink);
  border-radius: 9999px;
  transform-origin: 50% 0%;
  pointer-events: none;
  will-change: transform, opacity;
}

.${scope} .qv-liquidpool__goo .qv-liquidpool__spout {
  position: absolute;
  left: 0;
  top: 0;
  width: 22px;
  height: 22px;
  background: var(--qv-liquid-ink);
  border-radius: 50%;
  pointer-events: none;
  will-change: transform, opacity;
}

.${scope} #qv-pool-anchor {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 10px;
  height: 10px;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: var(--qv-liquid-ink);
  opacity: 0;
  pointer-events: none;
}

@keyframes ${spin1} {
  0% { transform: rotate(90deg); }
  100% { transform: rotate(450deg); }
}
@keyframes ${spin2} {
  0% { transform: rotate(-50deg); }
  100% { transform: rotate(310deg); }
}
@keyframes ${spin3} {
  0% { transform: rotate(220deg); }
  100% { transform: rotate(580deg); }
}
@keyframes ${spin4} {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes ${spin5} {
  0% { transform: rotate(-100deg); }
  100% { transform: rotate(260deg); }
}
@keyframes ${spin6} {
  0% { transform: rotate(210deg); }
  100% { transform: rotate(570deg); }
}

@keyframes ${dropOut} {
  0% { transform: translate(0px, 0px) scale(1.1); opacity: 1; }
  70% { opacity: 1; }
  100% { transform: translate(calc(var(--qv-drop-x) * 1px), calc(var(--qv-drop-y) * 1px)) scale(0.35); opacity: 0; }
}

@keyframes ${dropIn} {
  0% { transform: translate(calc(var(--qv-drop-x) * 1px), calc(var(--qv-drop-y) * 1px)) scale(0.35); opacity: 0.9; }
  30% { opacity: 1; }
  100% { transform: translate(0px, 0px) scale(1.05); opacity: 0; }
}
`.trim()
  }, [scope, keySuffix])

  const [drops, setDrops] = useState<BurstDrop[]>([])
  const dropCounter = useRef(0)

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<AnimStartPayload>
      const d = ce.detail
      if (!d || d.phase !== 'start') return
      if (dryState === 'dry') return

      const n = Math.max(1, Math.floor(burstCount))
      const base =
        typeof d.poolIndex === 'number'
          ? ((d.poolIndex % 997) + 997) % 997
          : Math.floor(Math.random() * 997)
      const seedBase = base / 997

      // Direction vector based on actual layout: pool -> diamond.
      // This ensures gooey detachment/attachment faces the real UI geometry.
      let vx = 0
      let vy = 0
      const poolEl = mainRef.current
      const diamondEl = getDiamondCircleEl(d)
      if (poolEl && diamondEl) {
        const p = getScreenCenter(poolEl)
        const t = getScreenCenter(diamondEl)
        vx = t.x - p.x
        vy = t.y - p.y
      } else {
        // Fallback: deterministic-ish direction from seed
        const ang = (seedBase * 2 - 1) * (Math.PI / 2)
        vx = Math.cos(ang)
        vy = Math.sin(ang)
      }

      const newDrops: BurstDrop[] = []
      for (let i = 0; i < n; i++) {
        newDrops.push({
          id: dropCounter.current++,
          direction: d.direction,
          seed: (seedBase + i / (n + 1)) % 1,
          vx,
          vy,
        })
      }
      setDrops((prev) => [...prev, ...newDrops])

      window.setTimeout(() => {
        const ids = new Set(newDrops.map((x) => x.id))
        setDrops((prev) => prev.filter((x) => !ids.has(x.id)))
      }, 700)
    }

    window.addEventListener('qv:anim', handler as EventListener)
    return () => window.removeEventListener('qv:anim', handler as EventListener)
  }, [burstCount, dryState])

  const burstEls = drops.flatMap((d) => {
    // Direction is determined by layout (vx,vy) with small wobble for organic feel.
    const mag = Math.max(0.0001, Math.hypot(d.vx, d.vy))
    const ux = d.vx / mag
    const uy = d.vy / mag

    // Small angular wobble for organic feel
    const wobble = (Math.sin(d.seed * 13.1) * Math.PI) / 18
    const cosW = Math.cos(wobble)
    const sinW = Math.sin(wobble)
    const rx = ux * cosW - uy * sinW
    const ry = ux * sinW + uy * cosW

    const dist = 26 + 26 * clamp01(Math.sin(d.seed * 11.7) * 0.5 + 0.5)
    const x = rx * dist
    const y = ry * dist
    const s = clamp01(Math.sin(d.seed * 7.3) * 0.5 + 0.5)
    const dur = 0.45 + 0.2 * s
    const className = `qv-liquidpool__drop ${d.direction === 'toDiamond' ? 'qv-out' : 'qv-in'}`
    const isOut = d.direction === 'toDiamond'

    // Exit/entry point: place it on the surface of the core blob, along the travel direction.
    // Core blob base radius is ~40px (width 80px). We scale it with the current target.
    const baseR = 40 * coreScaleTarget * liquidScaleClamped
    const dirLen = Math.max(0.0001, Math.hypot(x, y))
    const dx = x / dirLen
    const dy = y / dirLen
    const ox = dx * baseR * 0.9
    const oy = dy * baseR * 0.9

    const initial = isOut
      ? { x: ox, y: oy, scale: 1.1, opacity: 1 }
      : { x: ox + x, y: oy + y, scale: 0.35, opacity: 0.9 }
    const animate = isOut
      ? { x: ox + x, y: oy + y, scale: 0.35, opacity: 0 }
      : { x: ox, y: oy, scale: 1.05, opacity: 0 }

    // "Gooey spout" pulse at the exact exit/entry point.
    // This makes the departure/arrival look like it disturbs the pool surface locally.
    const spout = (
      <motion.span
        key={`spout-${d.id}`}
        className='qv-liquidpool__spout'
        initial={{
          x: ox - 11,
          y: oy - 11,
          scale: isOut ? 0.95 : 0.85,
          opacity: 0.95,
        }}
        animate={{
          x: ox - 11,
          y: oy - 11,
          scale: isOut ? [0.95, 1.55, 1.0] : [0.85, 1.25, 0.95],
          opacity: [0.95, 0.95, 0],
        }}
        transition={{
          duration: Math.max(0.18, dur * 0.6),
          times: [0, 0.55, 1],
          ease: [0.2, 0.9, 0.2, 1],
        }}
      />
    )

    // Tether: a little "neck" that stretches from the pool before the droplet detaches (only on out).
    // Our tether element is a vertical capsule that grows downward; rotate it to align with the vector (x,y).
    const len = Math.max(10, Math.hypot(x, y))
    const rotDeg = (Math.atan2(y, x) * 180) / Math.PI - 90
    const tether = isOut ? (
      <motion.span
        key={`tether-${d.id}`}
        className='qv-liquidpool__tether'
        // IMPORTANT: don't set `style.transform` directly; Framer controls transforms.
        style={{ height: `${len}px` }}
        initial={{
          opacity: 0.95,
          scaleY: 0.12,
          scaleX: 1,
          rotate: rotDeg,
          x: ox - 7, // half of tether width (14px) to center it on origin
          y: oy,
        }}
        animate={{
          opacity: [0.95, 0.95, 0],
          scaleY: [0.12, 1.0, 0.25],
          scaleX: [1, 0.75, 0],
          rotate: rotDeg,
          x: ox - 7,
          y: oy,
        }}
        transition={{
          duration: Math.max(0.2, dur * 0.75),
          times: [0, 0.65, 1],
          ease: [0.2, 0.9, 0.2, 1],
        }}
      />
    ) : null

    const droplet = (
      <motion.span
        key={d.id}
        className={className}
        initial={initial}
        animate={animate}
        transition={{ duration: dur, ease: [0.2, 0.9, 0.2, 1] }}
        style={
          {
            width: `${18 + s * 10}px`,
            height: `${18 + s * 10}px`,
          } as React.CSSProperties
        }
      >
        <span />
      </motion.span>
    )
    // Ordering matters: spout pulse should be "behind" the tether/droplet.
    if (tether) return [spout, tether, droplet]
    return [spout, droplet]
  })

  // Continuous "gooey churn" at the exit/entry point while credits are streaming.
  const streamCount = Math.max(inFlightToDiamond, inFlightToPool)
  const hasStream = streamCount > 0
  const vec = lastVectorRef.current ?? { vx: 1, vy: 0 }
  const vmag = Math.max(0.0001, Math.hypot(vec.vx, vec.vy))
  const ux = vec.vx / vmag
  const uy = vec.vy / vmag
  const baseR = 40 * coreScaleTarget * liquidScaleClamped
  const oxStream = ux * baseR * 0.9
  const oyStream = uy * baseR * 0.9
  const streamStrength = Math.min(1, streamCount / 6) // saturate around ~6 concurrent credits

  const streamSpout = (
    <motion.span
      key='stream-spout'
      className='qv-liquidpool__spout'
      style={{ x: oxStream - 11, y: oyStream - 11 }}
      animate={
        hasStream
          ? {
              opacity: 0.92,
              scale: [
                1.1 + 0.25 * streamStrength,
                1.65 + 0.55 * streamStrength,
                1.15 + 0.2 * streamStrength,
              ],
            }
          : { opacity: 0 }
      }
      transition={
        hasStream
          ? {
              duration: 0.45,
              repeat: Infinity,
              repeatType: 'mirror',
              ease: [0.2, 0.9, 0.2, 1],
            }
          : { duration: 0.12 }
      }
    />
  )

  return (
    <>
      <style>{cssText}</style>
      <main
        data-pool='true'
        data-liquid-pool='true'
        ref={mainRef as unknown as React.RefObject<HTMLElement>}
        className={`${scope}${dryState === 'drying' ? ' qv-liquidpool--drying' : ''}${dryState === 'dry' ? ' qv-liquidpool--dry' : ''}`}
        style={
          {
            '--qv-liquid-bg': backgroundColor,
            '--qv-liquid-ink': inkColor,
            '--qv-liquid-w': `${w}px`,
            '--qv-liquid-h': `${h}px`,
            '--qv-liquid-blur': `${blurPx}px`,
            '--qv-liquid-contrast': String(contrast),
            '--qv-liquid-blend': String(mixBlendMode ?? 'normal'),
            '--qv-liquid-scale': String(liquidScaleClamped),
            '--qv-liquid-radius': radius,
            '--qv-dry-ms': `${Math.max(0, dryOutMs)}ms`,
            '--qv-mass': String(mass),
          } as React.CSSProperties
        }
        aria-label='Quadratic vote liquid pool'
      >
        {/* VoteAnimation anchor (HTML element now) */}
        <span id='qv-pool-anchor' />

        {/* Exact CodePen structure (hidden structurally when dry) */}
        {dryState !== 'dry' ? (
          <div className='qv-liquidpool__goo'>
            <motion.div
              style={{ willChange: 'transform', transformOrigin: 'center' }}
              animate={dryState === 'wet' ? { scale: coreScale } : { scale: 0.01 }}
              transition={{ type: 'spring', stiffness: 220, damping: 26, mass: 0.7 }}
              aria-label='Liquid pool core'
            >
              <div>
                <span />
              </div>
              <div>
                <span />
              </div>
            </motion.div>

            <span>
              <span />
            </span>
            <span>
              <span />
            </span>
            <span>
              <span />
            </span>
            <span>
              <span />
            </span>
            <span>
              <span />
            </span>

            {/* Event-driven droplet bursts */}
            <span className='qv-liquidpool__burst'>
              {/* Continuous spout disturbance during multi-credit streams */}
              {streamSpout}
              <AnimatePresence initial={false}>{burstEls}</AnimatePresence>
            </span>
          </div>
        ) : null}
      </main>
    </>
  )
}

export default LiquidPool
