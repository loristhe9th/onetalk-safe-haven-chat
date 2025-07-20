import React from 'react';
import { cn } from "@/lib/utils"; 

interface MascotProps extends React.SVGProps<SVGSVGElement> {
  variant?: 'happy' | 'waiting' | 'typing';
  className?: string;
}

const Mascot = ({ variant = 'happy', className, ...props }: MascotProps) => {
  // Định nghĩa màu sắc cho từng trạng thái bubble
  // Các class này sẽ lấy màu từ file index.css của bạn
  const variantClasses = {
    happy: "text-[--primary]",      // Màu tím khói #6C5B7B (khi trò chuyện)
    waiting: "text-[--accent]",     // Màu tím pastel nhạt #BBA0CA (khi lắng nghe/chờ)
    typing: "text-primary",         // Dùng màu happy khi đang gõ
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100" // Giữ tỷ lệ vuông để dễ dàng căn chỉnh
      className={cn("transition-colors duration-300", variantClasses[variant], className)}
      {...props}
    >
      {/* Thân bubble được vẽ lại cho mềm mại và có đuôi cong */}
      <path
        fill="currentColor"
        d="M50,5 C25.15,5 5,25.15 5,50 C5,74.85 25.15,95 50,95 C68,95 83.5,85 91,72 C94,79 99,78 96,70 C99,65 95,62 95,50 C95,25.15 74.85,5 50,5 Z"
      />
      
      {/* Mắt và miệng sử dụng màu tím than đậm #3B2D4C */}
      <circle cx="42" cy="45" r="5" fill="#3B2D4C" />
      <circle cx="62" cy="45" r="5" fill="#3B2D4C" />

      {/* Biểu cảm miệng thay đổi theo variant */}
      {variant === 'happy' && (
        <path d="M45 62 Q 52 72 59 62" stroke="#3B2D4C" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {variant === 'waiting' && (
        <path d="M45 65 Q 52 58 59 65" stroke="#3B2D4C" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
      {variant === 'typing' && (
        <g fill="#3B2D4C">
            <circle cx="42" cy="62" r="4" />
            <circle cx="52" cy="62" r="4" />
            <circle cx="62" cy="62" r="4" />
        </g>
      )}
    </svg>
  );
};

export default Mascot;
