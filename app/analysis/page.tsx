'use client';

import { useEffect, useState } from 'react';
import { useAnalysis } from '../contexts/AnalysisContext';
import RoundRangeSelector from '@/components/RoundRangeSelector';

// 볼 색상
const getBallColor = (num: number): string => {
  if (num <= 10) return 'bg-yellow-400 text-yellow-900';
  if (num <= 20) return 'bg-blue-500 text-white';
  if (num <= 30) return 'bg-red-500 text-white';
  if (num <= 40) return 'bg-gray-600 text-white';
  return 'bg-green-500 text-white';
};

const LottoBall = ({ num }: { num: number }) => (
  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md ${getBallColor(num)}`}>
    {num}
  </div>
);

export default function AnalysisPage() {
  const { loading, filteredDrawings, startRound, endRound } = useAnalysis();
  const [activeTab, setActiveTab] = useState<'frequency' | 'pattern'>('frequency');

  // 통계 계산 결과
  const [stats, setStats] = useState({
    totalRounds: 0,
    frequency: {} as Record<number, number>,
    hotNumbers: [] as number[],
    coldNumbers: [] as number[],
    notAppeared: [] as { number: number; gap: number }[],
    oddRatio: 0,
    avgSum: 0,
  });

  useEffect(() => {
    if (filteredDrawings.length > 0) {
      calculateStats(filteredDrawings);
    }
  }, [filteredDrawings]);

  const calculateStats = (data: { round: number; numbers: number[]; bonus: number }[]) => {
    // 회차 내림차순 정렬
    const sortedData = [...data].sort((a, b) => b.round - a.round);
    
    // 빈도 계산
    const freq: Record<number, number> = {};
    for (let i = 1; i <= 45; i++) freq[i] = 0;
    
    let totalOdd = 0;
    let totalSum = 0;

    sortedData.forEach((d) => {
      d.numbers.forEach((num) => {
        freq[num]++;
        if (num % 2 === 1) totalOdd++;
      });
      totalSum += d.numbers.reduce((a, b) => a + b, 0);
    });

    // HOT/COLD (최근 50회 기준)
    const recent50 = sortedData.slice(0, Math.min(50, sortedData.length));
    const recentFreq: Record<number, number> = {};
    for (let i = 1; i <= 45; i++) recentFreq[i] = 0;
    recent50.forEach((d) => d.numbers.forEach((num) => recentFreq[num]++));
    
    const sortedRecent = Object.entries(recentFreq)
      .map(([num, count]) => ({ num: parseInt(num), count }))
      .sort((a, b) => b.count - a.count);
    
    const hot = sortedRecent.slice(0, 5).map((x) => x.num);
    const cold = sortedRecent.slice(-5).reverse().map((x) => x.num);

    // 미출현 갭
    const latestRound = sortedData[0]?.round || 0;
    const lastAppeared: Record<number, number> = {};
    for (let i = 1; i <= 45; i++) lastAppeared[i] = 0;
    
    sortedData.forEach((d) => {
      d.numbers.forEach((num) => {
        if (lastAppeared[num] === 0) lastAppeared[num] = d.round;
      });
    });

    const notAppearedList = Object.entries(lastAppeared)
      .map(([num, round]) => ({ 
        number: parseInt(num), 
        gap: round === 0 ? sortedData.length : latestRound - round
      }))
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 10);

    setStats({
      totalRounds: sortedData.length,
      frequency: freq,
      hotNumbers: hot,
      coldNumbers: cold,
      notAppeared: notAppearedList,
      oddRatio: totalOdd / (sortedData.length * 6),
      avgSum: totalSum / sortedData.length,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">분석 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'frequency', label: '출현 빈도' },
    { id: 'pattern', label: '패턴 분석' },
  ] as const;

  // 빈도순 정렬
  const sortedFreq = Object.entries(stats.frequency)
    .map(([num, count]) => ({ num: parseInt(num), count }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">📊 통계 분석</h1>
          <p className="mt-2 text-gray-600">
            {startRound}회 ~ {endRound}회 ({stats.totalRounds.toLocaleString()}회차) 데이터 기반 분석
          </p>
        </div>

        {/* 회차 범위 설정 */}
        <div className="mb-6">
          <RoundRangeSelector compact />
        </div>

        {/* 탭 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 출현 빈도 탭 */}
        {activeTab === 'frequency' && (
          <div className="space-y-6">
            {/* HOT/COLD */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 text-red-600">🔥 HOT 번호 (최근 50회)</h3>
                <div className="flex flex-wrap gap-3">
                  {stats.hotNumbers.map((num) => (
                    <LottoBall key={num} num={num} />
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4 text-blue-600">❄️ COLD 번호 (최근 50회)</h3>
                <div className="flex flex-wrap gap-3">
                  {stats.coldNumbers.map((num) => (
                    <LottoBall key={num} num={num} />
                  ))}
                </div>
              </div>
            </div>

            {/* 미출현 번호 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">⏰ 오래 안 나온 번호 TOP 10</h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {stats.notAppeared.map((item) => (
                  <div key={item.number} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <LottoBall num={item.number} />
                    <span className="text-sm font-medium text-orange-700">{item.gap}회</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 최다/최소 출현 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">📈 최다 출현 TOP 5</h3>
                <div className="space-y-3">
                  {sortedFreq.slice(0, 5).map((item, idx) => (
                    <div key={item.num} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 w-6">{idx + 1}.</span>
                        <LottoBall num={item.num} />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${(item.count / sortedFreq[0].count) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{item.count}회</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">📉 최소 출현 TOP 5</h3>
                <div className="space-y-3">
                  {sortedFreq.slice(-5).reverse().map((item, idx) => (
                    <div key={item.num} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-500 w-6">{idx + 1}.</span>
                        <LottoBall num={item.num} />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-gray-400 h-2 rounded-full"
                            style={{ width: `${(item.count / sortedFreq[0].count) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{item.count}회</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 전체 번호 히트맵 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">🎨 전체 번호 출현 빈도</h3>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  총 {stats.totalRounds.toLocaleString()}회차 분석
                </span>
              </div>
              <div className="grid grid-cols-9 gap-2">
                {Array.from({ length: 45 }, (_, i) => i + 1).map((num) => {
                  const count = stats.frequency[num] || 0;
                  const counts = Object.values(stats.frequency).filter(c => c > 0);
                  const minCount = Math.min(...counts);
                  const maxCount = Math.max(...counts);
                  const intensity = maxCount > minCount 
                    ? (count - minCount) / (maxCount - minCount) 
                    : 0.5;
                  const percentage = ((count / stats.totalRounds) * 100).toFixed(1);
                  return (
                    <div
                      key={num}
                      className="aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium cursor-pointer hover:scale-110 transition-transform relative group"
                      style={{
                        backgroundColor: intensity > 0.6 
                          ? `rgba(220, 38, 38, ${0.3 + intensity * 0.7})`
                          : intensity < 0.4 
                            ? `rgba(59, 130, 246, ${0.3 + (1-intensity) * 0.7})`
                            : `rgba(156, 163, 175, 0.5)`,
                        color: intensity > 0.7 || intensity < 0.3 ? 'white' : '#374151',
                      }}
                    >
                      <span className="font-bold">{num}</span>
                      <span className="text-xs opacity-80">{count}회</span>
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {num}번: {count}회 ({percentage}%)
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-gray-600">많이 출현</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 rounded"></div>
                  <span className="text-gray-600">보통</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-gray-600">적게 출현</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-gray-500">최다 출현</p>
                  <p className="font-bold text-red-600">{sortedFreq[0]?.num}번 ({sortedFreq[0]?.count}회)</p>
                </div>
                <div>
                  <p className="text-gray-500">최소 출현</p>
                  <p className="font-bold text-blue-600">{sortedFreq[44]?.num}번 ({sortedFreq[44]?.count}회)</p>
                </div>
                <div>
                  <p className="text-gray-500">평균 출현</p>
                  <p className="font-bold text-gray-700">{(stats.totalRounds * 6 / 45).toFixed(1)}회</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 패턴 분석 탭 */}
        {activeTab === 'pattern' && (
          <div className="space-y-6">
            {/* 주요 통계 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-sm text-blue-600">분석 회차</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalRounds.toLocaleString()}회</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-sm text-green-600">평균 합계</p>
                <p className="text-2xl font-bold text-gray-800">{stats.avgSum.toFixed(0)}</p>
                <p className="text-xs text-gray-500">권장: 100-180</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-sm text-purple-600">홀수 비율</p>
                <p className="text-2xl font-bold text-gray-800">{(stats.oddRatio * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-500">권장: 50% 내외</p>
              </div>
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <p className="text-sm text-yellow-600">짝수 비율</p>
                <p className="text-2xl font-bold text-gray-800">{((1 - stats.oddRatio) * 100).toFixed(1)}%</p>
              </div>
            </div>

            {/* 홀짝 비율 바 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">홀수/짝수 비율</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>홀수</span>
                  <span>{(stats.oddRatio * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-l-full"
                    style={{ width: `${stats.oddRatio * 100}%` }}
                  />
                </div>
                <p className="text-sm text-gray-500">
                  이상적인 비율은 3:3 또는 2:4 / 4:2 입니다.
                </p>
              </div>
            </div>

            {/* 색상 분포 가이드 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">🎨 번호 색상 구간</h3>
              <div className="grid grid-cols-5 gap-4">
                {[
                  { range: '1-10', color: 'bg-yellow-400', label: '노랑' },
                  { range: '11-20', color: 'bg-blue-500', label: '파랑' },
                  { range: '21-30', color: 'bg-red-500', label: '빨강' },
                  { range: '31-40', color: 'bg-gray-600', label: '검정' },
                  { range: '41-45', color: 'bg-green-500', label: '초록' },
                ].map((item) => (
                  <div key={item.range} className="text-center">
                    <div className={`w-12 h-12 ${item.color} rounded-full mx-auto mb-2 flex items-center justify-center text-white font-bold`}>
                      {item.range.split('-')[0]}
                    </div>
                    <p className="text-sm text-gray-600">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.range}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 추천 팁 */}
            <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
              <h3 className="text-lg font-semibold mb-3 text-indigo-800">💡 번호 선택 팁</h3>
              <ul className="space-y-2 text-sm text-indigo-700">
                <li>• 합계가 100~180 사이인 조합을 선택하세요</li>
                <li>• 홀수와 짝수 비율을 3:3 또는 2:4로 맞추세요</li>
                <li>• 연속된 번호는 2개 이하로 제한하세요</li>
                <li>• 최근 자주 나온 HOT 번호를 1-2개 포함하세요</li>
                <li>• 오래 안 나온 번호를 1-2개 포함하세요</li>
              </ul>
            </div>
          </div>
        )}

        {/* 면책 조항 */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ 본 통계는 과거 데이터 분석 결과이며, 미래 당첨을 보장하지 않습니다.
            로또는 완전한 무작위 추첨입니다.
          </p>
        </div>
      </div>
    </div>
  );
}
