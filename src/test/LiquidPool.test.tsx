import React from 'react'
import '@testing-library/jest-dom/vitest'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import QuadraticVote from '../QuadraticVote'
import { questions } from './test-utils'

describe('LiquidPool Component', () => {
  const Wrapper = ({
    credits,
    children,
  }: {
    credits: number
    children: React.ReactNode
  }) => (
    <QuadraticVote.Provider credits={credits} questions={questions}>
      {children}
    </QuadraticVote.Provider>
  )

  it('renders an SVG with a single VoteAnimation anchor (no per-credit pool circles)', () => {
    const { container } = render(
      <Wrapper credits={100}>
        <QuadraticVote.LiquidPool />
      </Wrapper>,
    )

    const el = container.querySelector('[data-liquid-pool="true"]')
    expect(el).toBeInTheDocument()

    const anchor = container.querySelector('#qv-pool-anchor')
    expect(anchor).toBeInTheDocument()

    // LiquidPool should not generate per-credit pool circles (those belong to Pool).
    expect(container.querySelector('#pool-0')).toBeNull()
  })

  it('supports rectangle shape', () => {
    const { container } = render(
      <Wrapper credits={100}>
        <QuadraticVote.LiquidPool shape='rect' width={140} height={50} />
      </Wrapper>,
    )

    const el = container.querySelector('[data-liquid-pool="true"]')
    expect(el).toBeInTheDocument()
  })
})


