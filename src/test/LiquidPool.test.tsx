import React from 'react'
import '@testing-library/jest-dom/vitest'
import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import QuadraticVote from '../QuadraticVote'
import { questions } from './test-utils'

describe('LiquidPool Component', () => {
  afterEach(() => {
    cleanup()
  })

  const Wrapper = ({ credits, children }: { credits: number; children: React.ReactNode }) => (
    <QuadraticVote.Provider credits={credits} questions={questions}>
      {children}
    </QuadraticVote.Provider>
  )

  it('renders the liquid as gooey-filtered blobs rather than a clipped box', () => {
    const { container } = render(
      <Wrapper credits={100}>
        <QuadraticVote.LiquidPool />
      </Wrapper>,
    )

    const el = container.querySelector('[data-liquid-pool="true"]') as HTMLElement
    expect(el).toBeInTheDocument()

    // The old implementation clipped to a circle/rect, which cut the animation off.
    expect(el.style.overflow).not.toBe('hidden')

    const svg = el.querySelector('svg') as SVGSVGElement
    expect(svg.style.overflow).toBe('visible')

    // feColorMatrix pushes the blurred alpha back to a hard edge — without it
    // the blobs stay a soft smudge instead of fusing.
    expect(el.querySelector('filter feGaussianBlur')).toBeInTheDocument()
    expect(el.querySelector('filter feColorMatrix')).toBeInTheDocument()
  })

  it('declares its landing colour so returning credits know what to fade into', () => {
    const { container } = render(
      <Wrapper credits={100}>
        <QuadraticVote.LiquidPool inkColor='#38BDF8' />
      </Wrapper>,
    )

    const el = container.querySelector('[data-liquid-pool="true"]')
    expect(el).toHaveAttribute('data-circle-color', '#38BDF8')
  })

  it('gives every credit a flight anchor, spread across the blob and its droplets', () => {
    const credits = 25
    const { container } = render(
      <Wrapper credits={credits}>
        <QuadraticVote.LiquidPool droplets={4} />
      </Wrapper>,
    )

    // VoteAnimation looks these up by id, so one is needed per credit.
    for (let i = 0; i < credits; i++) {
      expect(container.querySelector(`#pool-${i}`)).toBeInTheDocument()
    }
    expect(container.querySelector('#qv-pool-anchor')).toBeInTheDocument()

    // Anchors sit inside the group they belong to so they move with it. Credits
    // should not all leave from the same spout.
    const groups = Array.from(container.querySelectorAll('#qv-pool-anchor'))
      .map((anchor) => anchor.parentElement)
      .filter(Boolean)
    expect(groups).toHaveLength(1)

    const mainGroup = groups[0] as HTMLElement
    const fromMain = mainGroup.querySelectorAll('[id^="pool-"]').length
    expect(fromMain).toBeGreaterThan(0)
    expect(fromMain).toBeLessThan(credits)
  })

  it('ties each droplet to the credit whose return makes it appear', () => {
    const credits = 36
    const droplets = 6
    const { container } = render(
      <Wrapper credits={credits}>
        <QuadraticVote.LiquidPool droplets={droplets} />
      </Wrapper>,
    )

    // Droplet k appears once `droplets * fill > k`, and pool index p leaves
    // `credits - p` available, so the crossing sits at
    // p = credits - credits * (k + 0.5) / droplets. For 36 credits and 6
    // droplets that is every sixth index, offset by three.
    const mainGroup = (container.querySelector('#qv-pool-anchor') as HTMLElement)
      .parentElement as HTMLElement
    const dropletIndices: number[] = []
    for (let i = 0; i < credits; i++) {
      const anchor = container.querySelector(`#pool-${i}`) as HTMLElement
      if (!mainGroup.contains(anchor)) dropletIndices.push(i)
    }

    expect(dropletIndices).toEqual([3, 9, 15, 21, 27, 33])
  })

  it('gives every droplet its own anchor group', () => {
    const { container } = render(
      <Wrapper credits={36}>
        <QuadraticVote.LiquidPool droplets={6} />
      </Wrapper>,
    )

    // Each droplet gets its own group, so a returning credit has somewhere to
    // fly to even before that droplet has formed.
    const anchorLayer = (container.querySelector('#qv-pool-anchor') as HTMLElement).parentElement
      ?.parentElement as HTMLElement
    expect(anchorLayer.children).toHaveLength(7)
  })

  it('drops its droplets when asked for none', () => {
    const { container } = render(
      <Wrapper credits={25}>
        <QuadraticVote.LiquidPool droplets={0} />
      </Wrapper>,
    )

    // Only the main blob group remains, so every credit leaves from it.
    const anchor = container.querySelector('#qv-pool-anchor') as HTMLElement
    const mainGroup = anchor.parentElement as HTMLElement
    expect(mainGroup.querySelectorAll('[id^="pool-"]').length).toBe(25)
  })

  it('sizes the flight anchors so credits do not fly out as zero-width dots', () => {
    const { container } = render(
      <Wrapper credits={9}>
        <QuadraticVote.LiquidPool />
      </Wrapper>,
    )

    // VoteAnimation derives the flying credit's radius from this box.
    const anchor = container.querySelector('#pool-0') as HTMLElement
    expect(anchor.style.width).toBe('10px')
    expect(anchor.style.height).toBe('10px')
  })
})
