import React, { useState } from 'react'
import QuadraticVote, { Question, useQuadraticVote } from '../src/QuadraticVote'

function Container() {
  const { questions, vote, reset } = useQuadraticVote()
  const [poolTab, setPoolTab] = useState<'grid' | 'liquid'>('grid')
  const [liquidShape, setLiquidShape] = useState<'circle' | 'rect'>('circle')

  return (
    <div style={{ display: 'flex', position: 'relative' }}>
      <div
        id='side'
        style={{
          position: 'sticky',
          padding: '1rem',
          height: 'fit-content',
          top: 0,
        }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            type='button'
            onClick={() => setPoolTab('grid')}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: poolTab === 'grid' ? '#111827' : '#fff',
              color: poolTab === 'grid' ? '#fff' : '#111827',
              cursor: 'pointer',
            }}
          >
            Grid Pool
          </button>
          <button
            type='button'
            onClick={() => setPoolTab('liquid')}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: '1px solid #ddd',
              background: poolTab === 'liquid' ? '#111827' : '#fff',
              color: poolTab === 'liquid' ? '#fff' : '#111827',
              cursor: 'pointer',
            }}
          >
            Liquid Pool
          </button>
        </div>

        {poolTab === 'grid' ? (
          <QuadraticVote.Pool creditColor='#D1D5DB' circleColor='#3B82F6' />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type='button'
                onClick={() => setLiquidShape('circle')}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  background: liquidShape === 'circle' ? '#111827' : '#fff',
                  color: liquidShape === 'circle' ? '#fff' : '#111827',
                  cursor: 'pointer',
                }}
              >
                Circle
              </button>
              <button
                type='button'
                onClick={() => setLiquidShape('rect')}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: '1px solid #ddd',
                  background: liquidShape === 'rect' ? '#111827' : '#fff',
                  color: liquidShape === 'rect' ? '#fff' : '#111827',
                  cursor: 'pointer',
                }}
              >
                Rect
              </button>
            </div>
          </div>
        )}

        <div>
          <button style={{ marginRight: 10 }} onClick={reset}>
            Reset
          </button>
        </div>
      </div>
      <div id='pamonha' style={{ position: 'absolute', left: '50%', top: 0 }}>
        <QuadraticVote.LiquidPool
          shape={liquidShape}
          size={120}
          liquidScale={0.5}
          inkColor='#ffffff'
          backgroundColor='#1c222b'
          blurPx={1}
          contrast={10}
          mixBlendMode='normal'
          burstCount={2}
          dryOutMs={0}
        />
      </div>

      <div id='container'>
        {questions.map((q: Question) => (
          <div
            key={q.id}
            style={{
              marginTop: 100,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <p style={{ maxWidth: 600, textAlign: 'center' }}>{q.question}</p>
            <QuadraticVote.Diamond
              id={q.id}
              neutralColor='#9CA3AF'
              positiveColor='#22C55E'
              negativeColor='#EF4444'
            />
            <div>
              <button
                style={{ marginRight: 10 }}
                onClick={() => vote(q.id, 1)}
                disabled={q.isDisabledUp}
              >
                Vote Yes
              </button>
              <button onClick={() => vote(q.id, -1)} disabled={q.isDisabledDown}>
                Vote No
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function App() {
  const questions: Question[] = [
    {
      question:
        'Should the city invest in a new public transportation system to reduce traffic congestion and improve sustainability?',
      vote: 0,
      id: 'one',
    },
    {
      question: 'Do you support increasing the minimum wage to $15 per hour?',
      vote: 0,
      id: 'two',
    },
    {
      question: 'Should the government allocate more funding to improve public schools?',
      vote: 0,
      id: 'three',
    },
    {
      question:
        'Do you believe stricter environmental regulations are necessary to combat climate change?',
      vote: 0,
      id: 'four',
    },
    {
      question:
        'Should the country adopt universal healthcare to provide healthcare coverage for all citizens?',
      vote: 0,
      id: 'five',
    },
    {
      question:
        'Do you agree with the proposed tax policy changes aimed at reducing income inequality?',
      vote: 0,
      id: 'six',
    },
  ]

  return (
    <QuadraticVote.Provider credits={100} questions={questions}>
      <Container />
    </QuadraticVote.Provider>
  )
}

export default App
