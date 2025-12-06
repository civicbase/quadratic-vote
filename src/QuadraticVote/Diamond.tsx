import React, { cloneElement, useEffect, useMemo, useState } from 'react'
import { useQuadraticVote } from '.'
import { createDiamond, setViewBox } from './utils'

/**
 * Props for the Diamond component
 */
export interface DiamondProps {
  /** Unique identifier matching a question in the Provider (required) */
  id: string | number
  /** Color when no vote is cast @default '#A9A9A9' */
  neutralColor?: string
  /** Color for positive votes @default '#00FF00' */
  positiveColor?: string
  /** Color for negative votes @default '#FF0000' */
  negativeColor?: string
  /** Radius of diamond circles in pixels @default 4 */
  circleRadius?: number
}

/**
 * Diamond component displays a diamond-shaped vote indicator for a question.
 *
 * The diamond grows as more votes are allocated, with circles filling in levels.
 * Supports both positive and negative voting with different colors.
 * Animates smoothly as credits are allocated/deallocated.
 *
 * @example
 * ```tsx
 * <QuadraticVote.Diamond
 *   id={0}
 *   neutralColor='#9CA3AF'
 *   positiveColor='#22C55E'
 *   negativeColor='#EF4444'
 * />
 * ```
 */
const Diamond: React.FC<DiamondProps> = ({
  id,
  neutralColor = '#A9A9A9',
  positiveColor = '#00FF00',
  negativeColor = '#FF0000',
  circleRadius = 4,
}) => {
  const { questions, credits } = useQuadraticVote()

  const [arriving, setArriving] = useState<Set<string>>(new Set())
  const [departing, setDeparting] = useState<Set<string>>(new Set())

  useEffect(() => {
    const startHandler = (e: Event) => {
      const ce = e as CustomEvent<{
        phase: 'start' | 'end'
        direction: 'toDiamond' | 'toPool'
        diamondId: string | number
        diamondLevel: number
        ai: number
        poolIndex: number
      }>
      const d = ce.detail
      if (!d || d.diamondId !== id) return
      const key = `${d.diamondLevel}-${d.ai}`
      if (d.direction === 'toDiamond' && d.phase === 'start') {
        setArriving((prev) => new Set(prev).add(key))
      } else if (d.direction === 'toPool' && d.phase === 'start') {
        setDeparting((prev) => new Set(prev).add(key))
      }
    }

    const endHandler = (e: Event) => {
      const ce = e as CustomEvent<{
        phase: 'end'
        direction: 'toDiamond' | 'toPool'
        diamondId: string | number
        diamondLevel: number
        ai: number
      }>
      const d = ce.detail
      if (!d || d.diamondId !== id) return
      const key = `${d.diamondLevel}-${d.ai}`
      if (d.direction === 'toDiamond') {
        setArriving((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      } else if (d.direction === 'toPool') {
        setDeparting((prev) => {
          const next = new Set(prev)
          next.delete(key)
          return next
        })
      }
    }

    window.addEventListener('qv:anim', startHandler as EventListener)
    window.addEventListener('qv:anim-diamond', endHandler as EventListener)
    return () => {
      window.removeEventListener('qv:anim', startHandler as EventListener)
      window.removeEventListener('qv:anim-diamond', endHandler as EventListener)
    }
  }, [id])

  const circles = useMemo(
    () => createDiamond(id, credits, circleRadius),
    [id, credits, circleRadius],
  )

  const question = useMemo(() => questions.find((q) => q.id === id), [questions, id])

  const voteLevel = question ? Math.abs(question.vote) : 0
  const voteColor = question
    ? question.vote > 0
      ? positiveColor
      : question.vote < 0
        ? negativeColor
        : neutralColor
    : neutralColor

  const viewBox = useMemo(() => setViewBox(circles), [circles])

  return (
    <svg
      data-diamond-id={String(id)}
      viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
      width={viewBox.width}
      height={viewBox.height}
    >
      <g>
        {circles.map((circle) => {
          const circleLevel = parseInt(circle.props['data-level'].split('-')[1])
          const circleAi = parseInt(circle.props['data-ai'])
          let fillColor = circleLevel <= voteLevel ? voteColor : neutralColor
          const circleKey = `${circleLevel}-${circleAi}`

          if (arriving.has(circleKey)) {
            fillColor = neutralColor
          }

          if (departing.has(circleKey)) {
            fillColor = voteColor
          }
          return cloneElement(circle, {
            style: {
              fill: fillColor,
              transition: 'fill 0.35s ease-out',
            },
          })
        })}
      </g>
    </svg>
  )
}

export default Diamond
