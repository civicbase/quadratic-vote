import { useEffect, useMemo, useState } from 'react'
import { useQuadraticVote } from '.'
import { setViewBox } from './utils'

/**
 * Props for the Pool component
 */
export interface PoolProps {
  /** Number of columns in the pool grid @default 5 */
  columns?: number
  /** Radius of each credit circle in pixels @default 4 */
  circleRadius?: number
  /** Spacing between circles in pixels @default 4 */
  circleSpacing?: number
  /** Reverse the fill direction (fill from bottom instead of top) @default false */
  reverse?: boolean
  /** Color of used/allocated credits @default 'black' */
  creditColor?: string
  /** Color of available/unused credits @default 'grey' */
  circleColor?: string
}

/**
 * Pool component displays the credit allocation pool with smooth animations.
 *
 * Shows available and used credits as circles in a grid layout.
 * Credits animate out when allocated to questions and return when deallocated.
 *
 * @example
 * ```tsx
 * <QuadraticVote.Pool
 *   columns={5}
 *   creditColor='#3B82F6'
 *   circleColor='#D1D5DB'
 * />
 * ```
 */
function Pool({
  columns = 5,
  circleRadius = 4,
  circleSpacing = 4,
  reverse = false,
  creditColor = 'black',
  circleColor = 'grey',
}: PoolProps) {
  const { credits, availableCredits } = useQuadraticVote()
  const usedCredits = credits - availableCredits
  const [arriving, setArriving] = useState<Set<number>>(new Set())
  const [departing, setDeparting] = useState<Set<number>>(new Set())

  useEffect(() => {
    const startHandler = (e: Event) => {
      const ce = e as CustomEvent<{
        phase: 'start' | 'end'
        direction: 'toDiamond' | 'toPool'
        poolIndex: number
      }>
      const d = ce.detail
      if (!d || typeof d.poolIndex !== 'number') return
      const idx = d.poolIndex
      if (d.direction === 'toDiamond' && d.phase === 'start') {
        setDeparting((prev) => new Set(prev).add(idx))
      } else if (d.direction === 'toPool' && d.phase === 'start') {
        setArriving((prev) => new Set(prev).add(idx))
      }
    }

    const endHandler = (e: Event) => {
      const ce = e as CustomEvent<{
        phase: 'end'
        direction: 'toDiamond' | 'toPool'
        poolIndex: number
      }>
      const d = ce.detail
      if (!d || typeof d.poolIndex !== 'number') return
      const idx = d.poolIndex
      if (d.direction === 'toDiamond') {
        setDeparting((prev) => {
          const next = new Set(prev)
          next.delete(idx)
          return next
        })
      } else if (d.direction === 'toPool') {
        setArriving((prev) => {
          const next = new Set(prev)
          next.delete(idx)
          return next
        })
      }
    }

    window.addEventListener('qv:anim', startHandler as EventListener)
    window.addEventListener('qv:anim-pool', endHandler as EventListener)
    return () => {
      window.removeEventListener('qv:anim', startHandler as EventListener)
      window.removeEventListener('qv:anim-pool', endHandler as EventListener)
    }
  }, [])

  const circles = useMemo(() => {
    const circleElements: JSX.Element[] = []

    for (let i = 0; i < credits; i++) {
      const column = i % columns
      const row = Math.floor(i / columns)
      const cx = column * (circleRadius * 2 + circleSpacing) + circleRadius
      const cy = row * (circleRadius * 2 + circleSpacing) + circleRadius

      const isUsedCredit = reverse ? i >= credits - usedCredits : i < usedCredits
      let fillColor = isUsedCredit ? creditColor : circleColor
      if (arriving.has(i)) fillColor = creditColor
      if (departing.has(i)) fillColor = creditColor

      circleElements.push(
        <circle
          id={`pool-${i}`}
          key={i}
          cx={cx}
          cy={cy}
          r={circleRadius}
          fill={fillColor}
          style={{ transition: 'fill 0.35s ease-out' }}
        />,
      )
    }

    return circleElements
  }, [
    credits,
    circleRadius,
    circleSpacing,
    columns,
    reverse,
    creditColor,
    circleColor,
    usedCredits,
    arriving,
    departing,
  ])

  const viewBox = useMemo(() => setViewBox(circles), [circles])

  return (
    <svg
      data-pool='true'
      data-reverse={reverse ? 'true' : 'false'}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      width={viewBox.width}
      height={viewBox.height}
    >
      {circles}
    </svg>
  )
}

export default Pool
