import React from 'react'
import { cn } from '@/lib/utils'

interface MascotProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'happy' | 'waiting' | 'typing'
  className?: string
}

export default function Mascot({
  variant = 'happy',
  className,
  ...props
}: MascotProps) {
  const colorClass = {
    happy: 'text-[--primary]',    // #6C5B7B
    waiting: 'text-[--accent]',   // #A9A1BD
    typing: 'text-[--primary]',
  }[variant]

  return (
    <svg
      viewBox="0 0 120 100"
      className={cn(colorClass, className)}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Body as an ellipse */}
      <ellipse
        cx="60" cy="50"
        rx="45" ry="40"
        fill="currentColor"
        stroke="#3B2D4C"
        strokeWidth="6"
      />

      {/* Tail: simple sharp triangle */}
      <path
        d="M95,70 L115,80 L95,85 Z"
        fill="currentColor"
        stroke="#3B2D4C"
        strokeWidth="6"
        strokeLinejoin="round"
        transform="rotate(15 95 80)"
      />

      {/* Eyes */}
      <circle cx="45" cy="45" r="5" fill="#3B2D4C" />
      <circle cx="65" cy="45" r="5" fill="#3B2D4C" />

      {/* Mouth or typing dots */}
      {variant === 'happy' && (
        <path
          d="M45,60 Q55,70 65,60"
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
          <circle cx="45" cy="62" r="4" />
          <circle cx="55" cy="62" r="4" />
          <circle cx="65" cy="62" r="4" />
        </g>
      )}
    </svg>
  )
}
