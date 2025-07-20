import React from 'react';
import { cn } from "@/lib/utils"; 

interface MascotProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'happy' | 'waiting' | 'typing';
  className?: string;
}

const Mascot = ({ variant = 'happy', className, ...props }: MascotProps) => {
  // Định nghĩa màu sắc cho từng trạng thái
  // Các class này sẽ lấy màu từ file index.css
  const variantClasses = {
    happy: "text-primary",        // Màu tím khói (#A9A1BD)
    waiting: "text-secondary",    // Màu tím đậm hơn
    typing: "text-muted",         // Màu tím muted
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 230"
      className={cn("transition-colors duration-300", variantClasses[variant], className)}
      {...props}
    >
      <defs>
        <style>
          {`.face-color { fill: hsl(var(--background)); }`}
          {`.face-stroke-color { stroke: hsl(var(--background)); }`}
        </style>
      </defs>
      <path
        fill="currentColor"
        d="M208 0H48C21.5 0 0 21.5 0 48v86c0 26.5 21.5 48 48 48h27.4c5.1 0 9.8 2.6 12.6 6.8l26.4 39.6c3.6 5.4 11.2 5.4 14.8 0l26.4-39.6c2.8-4.2 7.5-6.8 12.6-6.8H208c26.5 0 48-21.5 48-48V48c0-26.5-21.5-48-48-48z"
      />
      
      {/* Mắt */}
      <circle cx="100" cy="90" r="12" className="face-color" />
      <circle cx="160" cy="90" r="12" className="face-color" />

      {/* Biểu cảm miệng */}
      {variant === 'happy' && (
        <path d="M 110 125 Q 130 145 150 125" strokeWidth="6" fill="none" strokeLinecap="round" className="face-stroke-color" />
      )}
      {variant === 'waiting' && (
        <path d="M 115 135 Q 130 125 145 135" strokeWidth="6" fill="none" strokeLinecap="round" className="face-stroke-color" />
      )}
      {variant === 'typing' && (
        <g className="face-color">
            <circle cx="105" cy="130" r="8" />
            <circle cx="130" cy="130" r="8" />
            <circle cx="155" cy="130" r="8" />
        </g>
      )}
    </svg>
  );
};

export default Mascot;
