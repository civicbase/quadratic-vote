import { ReactNode } from 'react'

/** Shared 24×24 stroke icons for the demo, sized by the `size` prop. */
function Icon({ size = 18, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
    >
      {children}
    </svg>
  )
}

export function SunIcon() {
  return (
    <Icon>
      <circle cx='12' cy='12' r='4' />
      <path d='M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4' />
    </Icon>
  )
}

export function MoonIcon() {
  return (
    <Icon>
      <path d='M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z' />
    </Icon>
  )
}

export function ResetIcon() {
  return (
    <Icon>
      <path d='M3 12a9 9 0 1 0 3-6.7' />
      <path d='M3 4v5h5' />
    </Icon>
  )
}

export function ThumbsUpIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d='M7 22V11L11 2a3 3 0 0 1 3 3v4h5.3a2 2 0 0 1 2 2.3l-1.4 9a2 2 0 0 1-2 1.7z' />
      <path d='M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3' />
    </Icon>
  )
}

export function ThumbsDownIcon({ size }: { size?: number }) {
  return (
    <Icon size={size}>
      <path d='M17 2v11l-4 9a3 3 0 0 1-3-3v-4H4.7a2 2 0 0 1-2-2.3l1.4-9a2 2 0 0 1 2-1.7z' />
      <path d='M17 2h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3' />
    </Icon>
  )
}

export function PhoneIcon() {
  return (
    <Icon>
      <rect x='7' y='2' width='10' height='20' rx='2.5' />
      <path d='M10.5 18.5h3' />
    </Icon>
  )
}

export function TabletIcon() {
  return (
    <Icon>
      <rect x='4' y='2.5' width='16' height='19' rx='2.5' />
      <path d='M10.5 18.5h3' />
    </Icon>
  )
}

export function DesktopIcon() {
  return (
    <Icon>
      <rect x='2' y='4' width='20' height='13' rx='2' />
      <path d='M9 21h6M12 17v4' />
    </Icon>
  )
}
