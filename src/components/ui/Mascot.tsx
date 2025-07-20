// src/components/ui/Mascot.tsx
import React from 'react';

// Giả định bạn có một hàm tiện ích `cn` để nối các class, giống như trong shadcn/ui
// Nếu không có, bạn có thể cài đặt: npm install clsx tailwind-merge
// và tạo file lib/utils.ts: import { type ClassValue, clsx } from "clsx"; import { twMerge } from "tailwind-merge"; export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
import { cn } from "@/lib/utils"; 

interface MascotProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'idle' | 'talking' | 'listening';
  className?: string;
}

const Mascot = ({ variant = 'idle', className, ...props }: MascotProps) => {
  // Định nghĩa các màu sắc tương ứng với trạng thái
  const variants = {
    idle: "text-purple-300",      // Màu tím nhạt khi chờ
    talking: "text-purple-600",   // Màu tím đậm khi trò chuyện
    listening: "text-purple-400", // Một màu trung gian
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={cn("w-24 h-24 transition-colors duration-300", variants[variant], className)}
      {...props}
    >
      <path
        fill="currentColor"
        d="M85.5,42.2c0-17.5-14.2-31.7-31.7-31.7S22.1,24.7,22.1,42.2c0,12.1,6.8,22.7,16.7,27.8 c-1.3,2.4-3.1,4.7-5.3,6.5c-2.8,2.2-6.1,3.4-9.5,3.4c-1.1,0-2.2-0.9-2.2-2.2c0-0.9,0.7-1.8,1.6-2.1c3.1-1,5.6-3.1,7.5-5.8 c-9.9-5.7-16.6-16.3-16.6-28.1C14.3,20,31.5,2.8,53.8,2.8s41.5,17.2,41.5,39.4c0,20.4-15.5,37.3-35.3,39.2 c-0.1,0-0.2,0-0.3,0c-0.6,0-1.2,0-1.8,0c-1.1,0-2,0.9-2,2s0.9,2,2,2c0.8,0,1.5-0.1,2.3-0.1c4.2-0.2,8.3-1.6,11.9-4.2 c2.5-1.8,4.6-4.1,6.2-6.7C80.4,63,85.5,53.2,85.5,42.2z"
      />
      {/* Mắt và miệng sẽ có màu nền để tạo hiệu ứng "đục lỗ" */}
      <circle cx="45" cy="40" r="3.5" fill="var(--background-color, white)" />
      <circle cx="63" cy="40" r="3.5" fill="var(--background-color, white)" />
      <path
        d="M 47 53 Q 54 59 61 53"
        stroke="var(--background-color, white)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default Mascot;