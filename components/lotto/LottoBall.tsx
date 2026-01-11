// ============================================
// LottoBall 컴포넌트 - 로또 공 UI
// ============================================

'use client';

import { getBallColor } from '@/types';

interface LottoBallProps {
  number: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isBonus?: boolean;
  showScore?: number;
  animated?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

export default function LottoBall({ 
  number, 
  size = 'md', 
  isBonus = false,
  showScore,
  animated = false,
}: LottoBallProps) {
  const bgColor = getBallColor(number);
  
  return (
    <div className="relative inline-flex flex-col items-center">
      <div
        className={`
          ${sizeClasses[size]}
          rounded-full
          flex items-center justify-center
          font-bold text-white
          shadow-lg
          ${isBonus ? 'ring-2 ring-offset-2 ring-yellow-400' : ''}
          ${animated ? 'animate-bounce' : ''}
          transition-transform hover:scale-110
        `}
        style={{ 
          backgroundColor: bgColor,
          boxShadow: `inset -2px -2px 4px rgba(0,0,0,0.2), inset 2px 2px 4px rgba(255,255,255,0.3)`,
        }}
      >
        {number}
      </div>
      
      {isBonus && (
        <span className="absolute -bottom-5 text-xs text-gray-500 font-medium">
          보너스
        </span>
      )}
      
      {showScore !== undefined && (
        <span className="absolute -bottom-5 text-xs text-blue-600 font-medium">
          {showScore}점
        </span>
      )}
    </div>
  );
}

// 번호 배열을 공으로 표시하는 컴포넌트
interface LottoBallGroupProps {
  numbers: number[];
  bonus?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showPlus?: boolean;
}

export function LottoBallGroup({ 
  numbers, 
  bonus, 
  size = 'md',
  showPlus = true,
}: LottoBallGroupProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {numbers.map((num, idx) => (
        <LottoBall key={idx} number={num} size={size} />
      ))}
      
      {bonus !== undefined && (
        <>
          {showPlus && (
            <span className="text-gray-400 font-bold mx-1">+</span>
          )}
          <LottoBall number={bonus} size={size} isBonus />
        </>
      )}
    </div>
  );
}
