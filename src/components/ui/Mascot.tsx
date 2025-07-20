import React from 'react';
import { cn } from "@/lib/utils"; 

interface MascotProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'happy' | 'waiting' | 'typing';
  className?: string;
}

const Mascot = ({ variant = 'happy', className, ...props }: MascotProps) => {
  const variantClasses = {
    happy: "text-[--primary]",      // #6C5B7B
    waiting: "text-[--accent]",     // #A9A1BD
    typing: "text-[--primary]",
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("transition-colors duration-300", variantClasses[variant], className)}
      {...props}
    >
      {/* Bubble shape */}
      <path
        d="
          M50,5 
          C25,5 5,25 5,50 
          C5,75 25,95 50,95 
          C72,95 85,85 90,70 
          C92,78 98,76 95,60 
          C98,55 95,52 95,50 
          C95,25 75,5 50,5 
          Z
        "
        fill="currentColor"
        stroke="#3B2D4C"
        strokeWidth="6"
        strokeLinejoin="round"
      />

      {/* Eyes */}
      <circle cx="38" cy="42" r="5" fill="#3B2D4C" />
      <circle cx="62" cy="42" r="5" fill="#3B2D4C" />

      {/* Mouth / Dots */}
      {variant === 'happy' && (
        <path
          d="M40,60 Q50,70 60,60"
          stroke="#3B2D4C"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {variant === 'waiting' && (
        <path
          d="M40,65 Q50,58 60,65"
          stroke="#3B2D4C"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
        />
      )}
      {variant === 'typing' && (
        <g fill="#3B2D4C">
          <circle cx="38" cy="62" r="4" />
          <circle cx="50" cy="62" r="4" />
          <circle cx="62" cy="62" r="4" />
        </g>
      )}
    </svg>
  );
};

export default Mascot;
