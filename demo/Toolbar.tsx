import { CSSProperties, ReactNode, useState } from 'react'
import { useQuadraticVote } from '../src/QuadraticVote'
import { MoonIcon, ResetIcon, SunIcon } from './icons'
import { useTheme } from './theme'

export type PoolKind = 'grid' | 'liquid'
export type Device = 'mobile' | 'tablet' | 'desktop'

/**
 * Floating toolbar pinned to the bottom-centre of the demo. Add a control by
 * dropping another <ToolbarButton> in — the pill sizes itself.
 */
export default function Toolbar({
  device,
  onDeviceChange,
  poolKind,
  onPoolKindChange,
}: {
  device: Device
  onDeviceChange: (device: Device) => void
  poolKind: PoolKind
  onPoolKindChange: (kind: PoolKind) => void
}) {
  const { theme, themeName, toggleTheme } = useTheme()
  const { reset, credits, availableCredits } = useQuadraticVote()
  const spent = credits - availableCredits

  return (
    <div style={styles.wrapper}>
      <div
        style={{
          ...styles.pill,
          background: theme.surface,
          borderColor: theme.border,
          color: theme.text,
        }}
      >
        <ToolbarButton
          label={themeName === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          onClick={toggleTheme}
        >
          {themeName === 'dark' ? <SunIcon /> : <MoonIcon />}
        </ToolbarButton>

        <ToolbarButton label='Reset credits' onClick={reset} disabled={spent === 0}>
          <ResetIcon />
        </ToolbarButton>

        <div style={{ ...styles.divider, background: theme.border }} />

        <Segmented
          value={device}
          onChange={onDeviceChange}
          options={[
            { value: 'mobile', label: 'Mobile' },
            { value: 'tablet', label: 'Tablet' },
            { value: 'desktop', label: 'Desktop' },
          ]}
        />

        {/* The grid pool is too tall for a phone, and a tablet has no room for a
            sidebar either, so only desktop gets to choose. */}
        {device === 'desktop' && (
          <>
            <div style={{ ...styles.divider, background: theme.border }} />
            <Segmented
              value={poolKind}
              onChange={onPoolKindChange}
              options={[
                { value: 'grid', label: 'Grid' },
                { value: 'liquid', label: 'Liquid' },
              ]}
            />
          </>
        )}

        <div style={{ ...styles.divider, background: theme.border }} />

        <span style={{ ...styles.readout, color: theme.textMuted }}>
          <strong style={{ color: theme.text, fontVariantNumeric: 'tabular-nums' }}>
            {availableCredits}
          </strong>
          /{credits} credits
        </span>
      </div>
    </div>
  )
}

/** Segmented control — one option active at a time. */
function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (next: T) => void
  options: { value: T; label: string }[]
}) {
  const { theme } = useTheme()

  return (
    <div
      role='group'
      style={{ ...styles.segmented, background: theme.background, borderColor: theme.border }}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type='button'
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            style={{
              ...styles.segment,
              background: active ? theme.accent : 'transparent',
              color: active ? '#fff' : theme.textMuted,
              fontWeight: active ? 600 : 400,
            }}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function ToolbarButton({
  label,
  onClick,
  disabled = false,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: ReactNode
}) {
  const { theme } = useTheme()
  const [hovered, setHovered] = useState(false)

  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.button,
        color: theme.text,
        background: hovered && !disabled ? theme.border : 'transparent',
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
    </button>
  )
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    position: 'fixed',
    bottom: 24,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'center',
    pointerEvents: 'none',
    zIndex: 1000,
  },
  pill: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    borderRadius: 999,
    border: '1px solid',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)',
    backdropFilter: 'blur(8px)',
    transition: 'background 200ms ease, border-color 200ms ease',
    fontFamily:
      'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  button: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 999,
    border: 'none',
    padding: 0,
    transition: 'background 150ms ease, opacity 150ms ease',
  },
  divider: {
    width: 1,
    height: 20,
    margin: '0 4px',
  },
  segmented: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: 2,
    borderRadius: 999,
    border: '1px solid',
    transition: 'background 200ms ease, border-color 200ms ease',
  },
  segment: {
    border: 'none',
    borderRadius: 999,
    padding: '6px 14px',
    fontSize: 12,
    lineHeight: 1,
    cursor: 'pointer',
    transition: 'background 150ms ease, color 150ms ease',
  },
  readout: {
    fontSize: 12,
    padding: '0 12px 0 4px',
    whiteSpace: 'nowrap',
  },
}
