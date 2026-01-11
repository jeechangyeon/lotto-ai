// ============================================
// StatCard 컴포넌트 - 통계 표시 카드
// ============================================

'use client';

import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'gray';
}

const colorClasses = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  gray: 'bg-gray-50 border-gray-200 text-gray-700',
};

const iconBgClasses = {
  blue: 'bg-blue-100',
  green: 'bg-green-100',
  red: 'bg-red-100',
  yellow: 'bg-yellow-100',
  purple: 'bg-purple-100',
  gray: 'bg-gray-100',
};

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon,
  trend,
  color = 'blue',
}: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${colorClasses[color]} transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm opacity-70">{subtitle}</p>
          )}
        </div>
        
        {icon && (
          <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
            {icon}
          </div>
        )}
      </div>
      
      {trend && (
        <div className="mt-3 flex items-center gap-1 text-sm">
          {trend === 'up' && (
            <span className="text-green-600">↑ 상승 추세</span>
          )}
          {trend === 'down' && (
            <span className="text-red-600">↓ 하락 추세</span>
          )}
          {trend === 'neutral' && (
            <span className="text-gray-600">→ 유지</span>
          )}
        </div>
      )}
    </div>
  );
}

// 숫자 리스트 카드
interface NumberListCardProps {
  title: string;
  numbers: number[];
  type?: 'hot' | 'cold' | 'default';
  showRank?: boolean;
}

export function NumberListCard({ 
  title, 
  numbers, 
  type = 'default',
  showRank = false,
}: NumberListCardProps) {
  const bgClass = type === 'hot' 
    ? 'bg-red-50 border-red-200' 
    : type === 'cold' 
      ? 'bg-blue-50 border-blue-200' 
      : 'bg-gray-50 border-gray-200';

  const badgeClass = type === 'hot' 
    ? 'bg-red-500' 
    : type === 'cold' 
      ? 'bg-blue-500' 
      : 'bg-gray-500';

  return (
    <div className={`rounded-xl border p-5 ${bgClass}`}>
      <h4 className="font-semibold text-gray-800 mb-3">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {numbers.map((num, idx) => (
          <div key={num} className="relative">
            <span 
              className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-white font-bold ${badgeClass}`}
            >
              {num}
            </span>
            {showRank && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full text-xs flex items-center justify-center font-bold text-gray-800">
                {idx + 1}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// 진행바 카드
interface ProgressCardProps {
  title: string;
  items: { label: string; value: number; color: string }[];
  unit?: string;
}

export function ProgressCard({ title, items, unit = '%' }: ProgressCardProps) {
  return (
    <div className="bg-white rounded-xl border p-5">
      <h4 className="font-semibold text-gray-800 mb-4">{title}</h4>
      <div className="space-y-3">
        {items.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">{item.label}</span>
              <span className="font-medium">
                {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}{unit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(item.value, 100)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
