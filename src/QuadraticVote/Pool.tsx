import { useEffect, useMemo, useState } from 'react'
import { useQuadraticVote } from '.'
import { setViewBox } from './utils'

interface PoolProps {
  columns?: number
  circleRadius?: number
  circleSpacing?: number
  reverse?: boolean
  creditColor?: string
  circleColor?: string
}

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

      const isUsedCredit = reverse
        ? i >= credits - usedCredits
        : i < usedCredits
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
