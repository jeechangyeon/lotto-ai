'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAnalysis } from './contexts/AnalysisContext';
import { useAuth, PLAN_CONFIG } from './contexts/AuthContext';
import RoundRangeSelector from '@/components/RoundRangeSelector';

// 볼 색상
const getBallColor = (num: number): string => {
  if (num <= 10) return 'bg-yellow-400 text-yellow-900';
  if (num <= 20) return 'bg-blue-500 text-white';
  if (num <= 30) return 'bg-red-500 text-white';
  if (num <= 40) return 'bg-gray-600 text-white';
  return 'bg-green-500 text-white';
};

interface Drawing {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
}

export default function DashboardPage() {
  const { loading, filteredDrawings, startRound, endRound, maxRoundInDB, allowedMinRound, allowedMaxRound } = useAnalysis();
  const { plan, planConfig, profile } = useAuth();
  const [recentDrawings, setRecentDrawings] = useState<Drawing[]>([]);
  const [stats, setStats] = useState({
    avgSum: 138,
    avgAC: 8.0,
    consecutiveRate: 52,
  });

  useEffect(() => {
    if (filteredDrawings.length > 0) {
      // 최근 5개 당첨번호 (필터링된 데이터 기준)
      const sorted = [...filteredDrawings].sort((a, b) => b.round - a.round);
      setRecentDrawings(sorted.slice(0, 5));

      // 통계 계산
      calculateStats(filteredDrawings);
    }
  }, [filteredDrawings]);

  const calculateStats = (drawings: { round: number; numbers: number[]; bonus: number }[]) => {
    let totalSum = 0;
    let totalAC = 0;
    let consecutiveCount = 0;

    drawings.forEach((d) => {
      // 합계
      const sum = d.numbers.reduce((a, b) => a + b, 0);
      totalSum += sum;

      // AC값
      const diffs = new Set<number>();
      for (let i = 0; i < 5; i++) {
        for (let j = i + 1; j < 6; j++) {
          diffs.add(Math.abs(d.numbers[j] - d.numbers[i]));
        }
      }
      totalAC += diffs.size - 5;

      // 연속번호
      const sorted = [...d.numbers].sort((a, b) => a - b);
      for (let i = 0; i < 5; i++) {
        if (sorted[i + 1] - sorted[i] === 1) {
          consecutiveCount++;
          break;
        }
      }
    });

    setStats({
      avgSum: Math.round(totalSum / drawings.length),
      avgAC: Math.round((totalAC / drawings.length) * 10) / 10,
      consecutiveRate: Math.round((consecutiveCount / drawings.length) * 100),
    });
  };

  const LottoBall = ({ num, isBonus = false }: { num: number; isBonus?: boolean }) => (
    <div
      className={`
        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md
        ${getBallColor(num)}
        ${isBonus ? 'ring-2 ring-offset-2 ring-purple-500' : ''}
      `}
    >
      {num}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const latestDrawing = recentDrawings[0];
  const analyzedCount = filteredDrawings.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 히어로 섹션 */}
      <section className="mb-10">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold mb-2">🎰 LottoAI</h1>
              <p className="text-blue-100 text-lg">AI 기반 로또 분석 및 번호 추천 서비스</p>
              <p className="text-blue-200 text-sm mt-2">
                {startRound}~{endRound}회차 ({analyzedCount.toLocaleString()}회) 분석 중 • 30가지 통계 적용
              </p>
            </div>
            
            {latestDrawing && (
              <div className="bg-white/10 backdrop-blur rounded-xl p-5">
                <p className="text-sm text-blue-200 mb-2">
                  최신 당첨번호 ({latestDrawing.round}회)
                </p>
                <div className="flex items-center gap-2">
                  {latestDrawing.numbers.map((num, i) => (
                    <LottoBall key={i} num={num} />
                  ))}
                  <span className="text-white/60 mx-1">+</span>
                  <LottoBall num={latestDrawing.bonus} isBonus />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 회차 범위 설정 */}
      <section className="mb-10">
        <RoundRangeSelector />
      </section>

      {/* 주요 통계 */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📊 주요 통계</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-blue-600">분석 회차</p>
            <p className="text-2xl font-bold text-gray-800">{analyzedCount.toLocaleString()}회</p>
            <p className="text-xs text-gray-500">{startRound}~{endRound}회</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-green-600">평균 합계</p>
            <p className="text-2xl font-bold text-gray-800">{stats.avgSum}</p>
            <p className="text-xs text-gray-500">권장: 115-160</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-purple-600">평균 AC값</p>
            <p className="text-2xl font-bold text-gray-800">{stats.avgAC}</p>
            <p className="text-xs text-gray-500">복잡도 지표 (7+ 권장)</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border">
            <p className="text-sm text-yellow-600">연속번호 포함률</p>
            <p className="text-2xl font-bold text-gray-800">{stats.consecutiveRate}%</p>
            <p className="text-xs text-gray-500">연속번호 있는 회차</p>
          </div>
        </div>
      </section>

      {/* 최근 당첨번호 */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">🎱 최근 당첨번호</h2>
          <Link href="/drawings" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            전체 보기 →
          </Link>
        </div>
        
        <div className="space-y-3">
          {recentDrawings.map((drawing) => (
            <div key={drawing.round} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600">{drawing.round}</div>
                    <div className="text-xs text-gray-500">회차</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {drawing.numbers.map((num, i) => (
                    <LottoBall key={i} num={num} />
                  ))}
                  <span className="text-gray-400 mx-1">+</span>
                  <LottoBall num={drawing.bonus} isBonus />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI 추천 안내 */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🤖 AI 추천 번호</h2>
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
          <p className="text-gray-700 mb-4">
            30가지 통계 분석 기반으로 AI가 추천하는 번호 조합을 확인하세요.
          </p>
          <Link
            href="/ai-recommend"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            AI 추천 받기 →
          </Link>
        </div>
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800">
            ⚠️ 이 추천은 통계 분석 기반이며, 당첨을 보장하지 않습니다. 로또는 완전한 무작위 추첨입니다.
          </p>
        </div>
      </section>

      {/* 빠른 링크 */}
      <section>
        <h2 className="text-xl font-bold text-gray-800 mb-4">🔗 바로가기</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/drawings" className="bg-white rounded-xl p-6 border text-center hover:shadow-md transition">
            <span className="text-3xl mb-2 block">🎱</span>
            <span className="font-medium text-gray-800">당첨번호 조회</span>
          </Link>
          <Link href="/analysis" className="bg-white rounded-xl p-6 border text-center hover:shadow-md transition">
            <span className="text-3xl mb-2 block">📊</span>
            <span className="font-medium text-gray-800">통계 분석</span>
          </Link>
          <Link href="/ai-recommend" className="bg-white rounded-xl p-6 border text-center hover:shadow-md transition">
            <span className="text-3xl mb-2 block">🤖</span>
            <span className="font-medium text-gray-800">AI 추천</span>
          </Link>
          <a href="https://www.dhlottery.co.kr" target="_blank" rel="noopener noreferrer" 
             className="bg-white rounded-xl p-6 border text-center hover:shadow-md transition">
            <span className="text-3xl mb-2 block">🏪</span>
            <span className="font-medium text-gray-800">동행복권</span>
          </a>
        </div>
      </section>
    </div>
  );
}
