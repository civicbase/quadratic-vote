import { ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'

/**
 * Theming for the demo app only. The library itself is colour-agnostic — every
 * component takes explicit colour props — so this is just a palette the demo
 * passes down.
 */

export type ThemeName = 'light' | 'dark'

export interface Theme {
  name: ThemeName
  background: string
  surface: string
  border: string
  text: string
  textMuted: string
  accent: string
  /** Pool: spent credits (`creditColor`) fade back, available (`circleColor`) pop. */
  poolCredit: string
  poolCircle: string
  liquidInk: string
  liquidBackground: string
  diamondNeutral: string
  diamondPositive: string
  diamondNegative: string
}

export const themes: Record<ThemeName, Theme> = {
  dark: {
    name: 'dark',
    background: '#1c222b',
    surface: '#252c37',
    border: '#3a4453',
    text: '#E5E7EB',
    textMuted: '#9CA3AF',
    accent: '#60A5FA',
    poolCredit: '#3a4453',
    poolCircle: '#60A5FA',
    liquidInk: '#ffffff',
    liquidBackground: '#1c222b',
    diamondNeutral: '#4B5563',
    diamondPositive: '#22C55E',
    diamondNegative: '#EF4444',
  },
  light: {
    name: 'light',
    background: '#F5F7FA',
    surface: '#ffffff',
    border: '#E5E7EB',
    text: '#111827',
    textMuted: '#6B7280',
    accent: '#2563EB',
    poolCredit: '#E5E7EB',
    poolCircle: '#2563EB',
    liquidInk: '#2563EB',
    liquidBackground: '#E8EEF9',
    diamondNeutral: '#D1D5DB',
    diamondPositive: '#16A34A',
    diamondNegative: '#DC2626',
  },
}

const STORAGE_KEY = 'qv-demo-theme'

interface ThemeContextValue {
  theme: Theme
  themeName: ThemeName
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>(null!)

function readInitialTheme(): ThemeName {
  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>(readInitialTheme)
  const theme = themes[themeName]

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, themeName)
    document.body.style.background = theme.background
    document.body.style.color = theme.text
    document.body.style.transition = 'background 200ms ease, color 200ms ease'
  }, [themeName, theme])

  const value = useMemo(
    () => ({
      theme,
      themeName,
      toggleTheme: () => setThemeName((current) => (current === 'dark' ? 'light' : 'dark')),
    }),
    [theme, themeName],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
