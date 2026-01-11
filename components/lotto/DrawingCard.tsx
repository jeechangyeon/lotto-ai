// ============================================
// DrawingCard 컴포넌트 - 당첨번호 표시 카드
// ============================================

'use client';

import { Drawing } from '@/types';
import { LottoBallGroup } from './LottoBall';
import { formatDate, formatMoney, drawingToNumbers } from '@/lib/utils';

interface DrawingCardProps {
  drawing: Drawing;
  showDetails?: boolean;
  compact?: boolean;
}

export default function DrawingCard({ 
  drawing, 
  showDetails = false,
  compact = false,
}: DrawingCardProps) {
  const numbers = drawingToNumbers(drawing);

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow">
        <div className="flex items-center gap-4">
          <span className="font-bold text-blue-600 min-w-[60px]">
            {drawing.round_no}회
          </span>
          <LottoBallGroup numbers={numbers} bonus={drawing.bonus} size="sm" />
        </div>
        <span className="text-sm text-gray-500">
          {formatDate(drawing.draw_date)}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border p-6 hover:shadow-lg transition-shadow">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900">
            제 {drawing.round_no}회
          </h3>
          <p className="text-sm text-gray-500">
            {formatDate(drawing.draw_date)}
          </p>
        </div>
        
        {drawing.prize_1st && (
          <div className="text-right">
            <p className="text-sm text-gray-500">1등 당첨금</p>
            <p className="text-lg font-bold text-green-600">
              {formatMoney(drawing.prize_1st)}
            </p>
          </div>
        )}
      </div>

      {/* 당첨번호 */}
      <div className="flex justify-center py-4">
        <LottoBallGroup numbers={numbers} bonus={drawing.bonus} size="lg" />
      </div>

      {/* 상세 정보 */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">번호 합계</span>
            <span className="ml-2 font-medium">{drawing.total_sum}</span>
          </div>
          <div>
            <span className="text-gray-500">홀수 개수</span>
            <span className="ml-2 font-medium">{drawing.odd_count}개</span>
          </div>
          {drawing.winners_1st && (
            <div className="col-span-2">
              <span className="text-gray-500">1등 당첨자</span>
              <span className="ml-2 font-medium">{drawing.winners_1st}명</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 추천 세트 카드
interface RecommendSetCardProps {
  setNumber: number;
  numbers: number[];
  totalSum?: number;
  oddCount?: number;
}

export function RecommendSetCard({ 
  setNumber, 
  numbers,
  totalSum,
  oddCount,
}: RecommendSetCardProps) {
  const sum = totalSum ?? numbers.reduce((a, b) => a + b, 0);
  const odds = oddCount ?? numbers.filter(n => n % 2 === 1).length;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200 hover:border-blue-400 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
          세트 {setNumber}
        </span>
        <div className="flex gap-3 text-xs text-gray-600">
          <span>합계: {sum}</span>
          <span>홀수: {odds}개</span>
        </div>
      </div>
      
      <div className="flex justify-center">
        <LottoBallGroup numbers={numbers} size="md" showPlus={false} />
      </div>
    </div>
  );
}
