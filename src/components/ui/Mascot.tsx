import React from 'react'
import { cn } from '@/lib/utils'

interface MascotProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'happy' | 'waiting' | 'typing'
  className?: string
}

const Mascot = ({
  variant = 'happy',
  className,
  ...props
}: MascotProps) => {
  const variantClasses = {
    happy: 'text-[--primary]',    // #6C5B7B
    waiting: 'text-[--accent]',   // #A9A1BD
    typing: 'text-[--primary]',
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 110 90"
      className={cn('transition-colors duration-300', variantClasses[variant], className)}
      {...props}
    >
      {/* Thân bubble */}
      <path
        d="
          M55,5
          C25,5 5,30 5,55
          C5,80 25,90 55,90
          C85,90 105,70 105,55
          C105,30 85,5 55,5
          Z
        "
        fill="currentColor"
        stroke="#3B2D4C"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Tail nhọn, dài */}
      <path
        d="M80,60 L100,85 L75,75 Z"
        fill="currentColor"
        stroke="#3B2D4C"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Mắt */}
      <circle cx="40" cy="45" r="5" fill="#3B2D4C" />
      <circle cx="70" cy="45" r="5" fill="#3B2D4C" />

      {/* Miệng / Typing */}
      {variant === 'happy' && (
        <path
          d="M Forty-five,60 Q55,70 65,60"
          stroke="#3B2D4C"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {variant === 'waiting' && (
        <path
          d="M45,65 Q55,58 65,65"
          stroke="#3B2D4C"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {variant === 'typing' && (
        <g fill="#3B2D4C">
          <circle cx="45" cy="65" r="4" />
          <circle cx="55" cy="65" r="4" />
          <circle cx="65" cy="65" r="4" />
        </g>
      )}
    </svg>
  )
}

export default Mascot
