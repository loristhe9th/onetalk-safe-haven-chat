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
      viewBox="0 0 100 90" // Tỷ lệ oval ngang hơn
      className={cn("transition-colors duration-300 opacity-95", variantClasses[variant], className)}
      {...props}
    >
      {/* Thân bubble được vẽ lại cho mềm mại và có đuôi cong */}
      <path
        fill="currentColor"
        stroke="#3B2D4C"
        strokeWidth="4"
        strokeLinejoin="round"
        d="M90,41 C90,59.23 72.09,75 50,75 C36.5,75 24.5,68 18,58 C22,62 28,61 29,55 C33,50 30,45 30,41 C30,22.77 47.91,7 70,7 C82.09,7 90,17.77 90,30 C90,33 89,37 87,40 C89,39 90,37 90,35 C90,30 87,26 83,24 C87,29 90,35 90,41Z"
      />
      
      {/* Mắt và miệng sử dụng màu tím than đậm #3B2D4C */}
      <circle cx="45" cy="40" r="7" fill="#3B2D4C" />
      <circle cx="65" cy="40" r="7" fill="#3B2D4C" />

      {/* Biểu cảm miệng thay đổi theo variant */}
      {variant === 'happy' && (
        <path d="M48 55 Q 55 65 62 55" stroke="#3B2D4C" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      )}
      {variant === 'waiting' && (
        <path d="M48 58 Q 55 52 62 58" stroke="#3B2D4C" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      )}
      {variant === 'typing' && (
        <g fill="#3B2D4C">
            <circle cx="45" cy="58" r="3.5" />
            <circle cx="55" cy="58" r="3.5" />
            <circle cx="65" cy="58" r="3.5" />
        </g>
      )}
    </svg>
  );
};

export default Mascot;
