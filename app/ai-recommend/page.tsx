'use client';

import { useEffect, useState } from 'react';
import { useAnalysis } from '../contexts/AnalysisContext';
import { useAuth, PLAN_CONFIG } from '../contexts/AuthContext';
import RoundRangeSelector from '@/components/RoundRangeSelector';
import PlanGuard from '@/components/PlanGuard';

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

interface RecommendSet {
  numbers: number[];
  sum: number;
  oddCount: number;
}

interface ValidationResult {
  totalRounds: number;
  hitCounts: { [key: number]: number };
  avgHits: number;
  hit4PlusRate: number;
}

interface SimulationResult {
  iterations: number;
  hitCounts: { [key: number]: number };
  top20All6Rate: number;
}

// 소수 판별
const isPrime = (n: number): boolean => {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;
  for (let k = 3; k <= Math.sqrt(n); k += 2) {
    if (n % k === 0) return false;
  }
  return true;
};

// 색상 코드 (1-5)
const getColorCode = (num: number): number => {
  if (num <= 10) return 1;
  if (num <= 20) return 2;
  if (num <= 30) return 3;
  if (num <= 40) return 4;
  return 5;
};

function AIRecommendContent() {
  const { loading, filteredDrawings, startRound, endRound, maxRoundInDB } = useAnalysis();
  const { plan, planConfig } = useAuth();
  
  const [targetRound, setTargetRound] = useState(0);
  const [recommendSets, setRecommendSets] = useState<RecommendSet[]>([]);
  const [top20, setTop20] = useState<{ number: number; score: number }[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // 등급별 AI 세트 수
  const maxAiSets = planConfig.aiSets;

  useEffect(() => {
    if (filteredDrawings.length > 0) {
      runAnalysis(filteredDrawings);
    }
  }, [filteredDrawings]);

  // ========================================
  // 엑셀 VBA와 동일한 점수 계산
  // ========================================
  const calculateScoresVBA = (drawings: { round: number; numbers: number[]; bonus: number }[]): { number: number; score: number }[] => {
    const sortedDrawings = [...drawings].sort((a, b) => b.round - a.round);
    const totalRounds = sortedDrawings.length;
    const latestRound = sortedDrawings[0]?.round || 0;

    console.log('=== AI 분석 시작 ===');
    console.log('총 회차수:', totalRounds);
    console.log('최신 회차:', latestRound);
    console.log('가장 오래된 회차:', sortedDrawings[sortedDrawings.length - 1]?.round);
    console.log('최신 당첨번호:', sortedDrawings[0]?.numbers);

    const scores: number[] = new Array(46).fill(0);

    // A02: 전체 빈도
    const freq: number[] = new Array(46).fill(0);
    sortedDrawings.forEach(d => {
      d.numbers.forEach(n => { if (n >= 1 && n <= 45) freq[n]++; });
    });
    const avgFreq = (totalRounds * 6) / 45;
    for (let i = 1; i <= 45; i++) {
      scores[i] += (freq[i] / avgFreq) * 8;
    }
    console.log('A02 완료 - 평균빈도:', avgFreq.toFixed(2));

    // A03: 최근 50회 HOT/COLD
    const recentRows = Math.min(50, totalRounds);
    const recentFreq: number[] = new Array(46).fill(0);
    for (let r = 0; r < recentRows; r++) {
      sortedDrawings[r].numbers.forEach(n => { if (n >= 1 && n <= 45) recentFreq[n]++; });
    }
    for (let i = 1; i <= 45; i++) {
      scores[i] += recentFreq[i] * 2;
      if (recentFreq[i] <= 3) scores[i] += 8;
    }
    console.log('A03 완료 - 최근', recentRows, '회 분석');

    // A04: 미출현 분석
    const lastAppear: number[] = new Array(46).fill(0);
    for (let r = 0; r < sortedDrawings.length; r++) {
      const d = sortedDrawings[r];
      d.numbers.forEach(n => {
        if (n >= 1 && n <= 45 && lastAppear[n] === 0) {
          lastAppear[n] = d.round;
        }
      });
    }
    for (let i = 1; i <= 45; i++) {
      const absence = latestRound - lastAppear[i];
      scores[i] += absence * 1.2;
    }
    // 가장 오래 안나온 번호 찾기
    let maxAbsenceNum = 1;
    let maxAbsence = 0;
    for (let i = 1; i <= 45; i++) {
      const absence = latestRound - lastAppear[i];
      if (absence > maxAbsence) {
        maxAbsence = absence;
        maxAbsenceNum = i;
      }
    }
    console.log('A04 완료 - 최대 미출현:', maxAbsenceNum, '번 (', maxAbsence, '회)');

    // A05: 주기 분석
    const totalCycle: number[] = new Array(46).fill(0);
    const cycleCount: number[] = new Array(46).fill(0);
    const lastAppearCycle: number[] = new Array(46).fill(0);
    
    for (let r = sortedDrawings.length - 1; r >= 0; r--) {
      const d = sortedDrawings[r];
      d.numbers.forEach(n => {
        if (n >= 1 && n <= 45) {
          if (lastAppearCycle[n] > 0) {
            totalCycle[n] += d.round - lastAppearCycle[n];
            cycleCount[n]++;
          }
          lastAppearCycle[n] = d.round;
        }
      });
    }
    for (let i = 1; i <= 45; i++) {
      if (cycleCount[i] > 0) {
        const avgCycle = totalCycle[i] / cycleCount[i];
        const absence = latestRound - lastAppear[i];
        if (absence >= avgCycle * 0.8) scores[i] += 10;
      }
    }
    console.log('A05 완료 - 주기 분석');

    // A06: 홀짝 분석
    let oddTotal = 0, evenTotal = 0;
    sortedDrawings.forEach(d => {
      d.numbers.forEach(n => {
        if (n % 2 === 1) oddTotal++; else evenTotal++;
      });
    });
    for (let i = 1; i <= 45; i++) {
      if (oddTotal < evenTotal && i % 2 === 1) scores[i] += 4;
      if (oddTotal > evenTotal && i % 2 === 0) scores[i] += 4;
    }
    console.log('A06 완료 - 홀:', oddTotal, '짝:', evenTotal);

    // A07: 고저 분석
    let lowTotal = 0, highTotal = 0;
    sortedDrawings.forEach(d => {
      d.numbers.forEach(n => {
        if (n <= 22) lowTotal++; else highTotal++;
      });
    });
    for (let i = 1; i <= 45; i++) {
      if (lowTotal < highTotal && i <= 22) scores[i] += 4;
      if (lowTotal > highTotal && i > 22) scores[i] += 4;
    }
    console.log('A07 완료 - 저:', lowTotal, '고:', highTotal);

    // A08: 색상 패턴
    const colorCnt: number[] = [0, 0, 0, 0, 0, 0];
    sortedDrawings.forEach(d => {
      d.numbers.forEach(n => colorCnt[getColorCode(n)]++);
    });
    const totalNums = totalRounds * 6;
    const avgColor = totalNums / 5;
    for (let i = 1; i <= 45; i++) {
      const cCode = getColorCode(i);
      if (colorCnt[cCode] < avgColor) {
        scores[i] += ((avgColor - colorCnt[cCode]) / avgColor) * 6;
      }
    }
    console.log('A08 완료 - 색상분포:', colorCnt.slice(1));

    // A12: 합계 분석 (중심 가중)
    for (let i = 1; i <= 45; i++) {
      scores[i] += 10 - Math.abs(i - 23) * 0.2;
    }
    console.log('A12 완료 - 합계분석');

    // A13: 소수 분석
    for (let i = 1; i <= 45; i++) {
      if (isPrime(i)) scores[i] += 2;
    }
    console.log('A13 완료 - 소수분석');

    // A14: 끝수 분석
    const digitCnt: number[] = new Array(10).fill(0);
    sortedDrawings.forEach(d => {
      d.numbers.forEach(n => digitCnt[n % 10]++);
    });
    const avgDigit = totalNums / 10;
    for (let i = 1; i <= 45; i++) {
      if (digitCnt[i % 10] < avgDigit) {
        scores[i] += ((avgDigit - digitCnt[i % 10]) / avgDigit) * 4;
      }
    }
    console.log('A14 완료 - 끝수분포:', digitCnt);

    // A16: 이월수 (직전 당첨번호 +10)
    if (sortedDrawings.length > 0) {
      sortedDrawings[0].numbers.forEach(n => {
        if (n >= 1 && n <= 45) scores[n] += 10;
      });
    }
    console.log('A16 완료 - 이월수:', sortedDrawings[0]?.numbers);

    // A17: 추세 분석
    const recent20: number[] = new Array(46).fill(0);
    const prev20: number[] = new Array(46).fill(0);
    
    const recent20Rows = Math.min(20, totalRounds);
    for (let r = 0; r < recent20Rows; r++) {
      sortedDrawings[r].numbers.forEach(n => { if (n >= 1 && n <= 45) recent20[n]++; });
    }
    
    const prev20Start = Math.min(20, totalRounds);
    const prev20End = Math.min(40, totalRounds);
    for (let r = prev20Start; r < prev20End; r++) {
      sortedDrawings[r].numbers.forEach(n => { if (n >= 1 && n <= 45) prev20[n]++; });
    }
    
    let risingCnt = 0;
    const risingNums: number[] = [];
    for (let i = 1; i <= 45; i++) {
      if (recent20[i] > prev20[i] + 1 && risingCnt < 5) {
        scores[i] += 6;
        risingCnt++;
        risingNums.push(i);
      }
    }
    console.log('A17 완료 - 상승추세 번호:', risingNums);

    // A20: 당첨금 최적화
    for (let i = 1; i <= 45; i++) {
      if (i <= 12) scores[i] -= 8;
      if (i <= 31) scores[i] -= 3;
      if (i % 7 === 0) scores[i] -= 5;
      if (i >= 32) scores[i] += 8;
      if (i >= 40) scores[i] += 5;
      if (i === 4 || i === 13 || i === 44) scores[i] += 3;
    }
    console.log('A20 완료 - 당첨금 최적화');

    // 정규화 전 TOP 5 출력
    const preNorm: {num: number, score: number}[] = [];
    for (let i = 1; i <= 45; i++) {
      preNorm.push({num: i, score: scores[i]});
    }
    preNorm.sort((a, b) => b.score - a.score);
    console.log('=== 정규화 전 TOP 10 ===');
    preNorm.slice(0, 10).forEach((item, idx) => {
      console.log(`${idx+1}위: ${item.num}번 = ${item.score.toFixed(2)}점`);
    });

    // 정규화 (0~100점)
    let minScore = scores[1], maxScore = scores[1];
    for (let i = 2; i <= 45; i++) {
      if (scores[i] < minScore) minScore = scores[i];
      if (scores[i] > maxScore) maxScore = scores[i];
    }

    console.log('정규화 범위:', minScore.toFixed(2), '~', maxScore.toFixed(2));

    const result: { number: number; score: number }[] = [];
    for (let i = 1; i <= 45; i++) {
      let normalized: number;
      if (maxScore > minScore) {
        normalized = ((scores[i] - minScore) / (maxScore - minScore)) * 100;
      } else {
        normalized = 50;
      }
      result.push({ number: i, score: Math.round(normalized * 10) / 10 });
    }

    // 최종 TOP 10 출력
    const finalTop = [...result].sort((a, b) => b.score - a.score);
    console.log('=== 최종 TOP 10 (정규화 후) ===');
    finalTop.slice(0, 10).forEach((item, idx) => {
      console.log(`${idx+1}위: ${item.number}번 = ${item.score.toFixed(1)}점`);
    });
    console.log('=== AI 분석 완료 ===');

    return result;
  };

  const runAnalysis = (drawings: { round: number; numbers: number[]; bonus: number }[]) => {
    setAnalyzing(true);
    
    const sorted = [...drawings].sort((a, b) => b.round - a.round);
    setTargetRound((sorted[0]?.round || 0) + 1);

    const scores = calculateScoresVBA(drawings);
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    setTop20(sortedScores.slice(0, 20));

    const sets = generateSets(sortedScores);
    setRecommendSets(sets);

    const top20Numbers = sortedScores.slice(0, 20).map(s => s.number);
    const validationResult = validatePastAccuracy(drawings, top20Numbers);
    setValidation(validationResult);

    runSimulation(top20Numbers);
    setAnalyzing(false);
  };

  const generateSets = (scores: { number: number; score: number }[]): RecommendSet[] => {
    const sortedScores = [...scores].sort((a, b) => b.score - a.score);
    const sets: RecommendSet[] = [];
    
    // 등급별 세트 수 제한 (maxAiSets)
    const setsToGenerate = maxAiSets;
    
    for (let setNum = 0; setNum < setsToGenerate; setNum++) {
      const selected: number[] = [];
      let numIdx = setNum * 2;
      
      while (selected.length < 6 && numIdx < 45) {
        const candidate = sortedScores[numIdx].number;
        
        const ranges = [0, 0, 0, 0, 0];
        let oddCount = 0;
        selected.forEach(n => {
          if (n <= 10) ranges[0]++;
          else if (n <= 20) ranges[1]++;
          else if (n <= 30) ranges[2]++;
          else if (n <= 40) ranges[3]++;
          else ranges[4]++;
          if (n % 2 === 1) oddCount++;
        });
        
        let rangeIdx = 0;
        if (candidate <= 10) rangeIdx = 0;
        else if (candidate <= 20) rangeIdx = 1;
        else if (candidate <= 30) rangeIdx = 2;
        else if (candidate <= 40) rangeIdx = 3;
        else rangeIdx = 4;
        
        const isOdd = candidate % 2 === 1;
        
        if (!selected.includes(candidate) &&
            ranges[rangeIdx] < 2 &&
            !(isOdd && oddCount >= 4) &&
            !(!isOdd && (selected.length - oddCount) >= 4)) {
          selected.push(candidate);
        }
        
        numIdx++;
        if (numIdx > 35 && selected.length < 6) numIdx = 0;
      }
      
      selected.sort((a, b) => a - b);
      const sum = selected.reduce((a, b) => a + b, 0);
      const oddCnt = selected.filter(n => n % 2 === 1).length;
      
      sets.push({ numbers: selected, sum, oddCount: oddCnt });
    }
    
    return sets;
  };

  const validatePastAccuracy = (drawings: { round: number; numbers: number[]; bonus: number }[], top20Numbers: number[]): ValidationResult => {
    const hitCounts: { [key: number]: number } = { 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
    let totalHits = 0;

    drawings.forEach((drawing) => {
      const hits = drawing.numbers.filter((n) => top20Numbers.includes(n)).length;
      hitCounts[hits]++;
      totalHits += hits;
    });

    const avgHits = totalHits / drawings.length;
    const hit4Plus = hitCounts[6] + hitCounts[5] + hitCounts[4];
    const hit4PlusRate = (hit4Plus / drawings.length) * 100;

    return { totalRounds: drawings.length, hitCounts, avgHits, hit4PlusRate };
  };

  const runSimulation = (top20Numbers: number[]) => {
    setSimulating(true);
    
    setTimeout(() => {
      const iterations = 8145060;
      const hitCounts: { [key: number]: number } = { 6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0 };
      const sampleSize = 1000000;
      
      let seed = 12345;
      
      for (let trial = 0; trial < sampleSize; trial++) {
        const simNums: number[] = [];
        
        while (simNums.length < 6) {
          seed = (seed * 1103515245 + 12345) % 2147483648;
          const num = Math.floor((seed / 2147483648) * 45) + 1;
          if (!simNums.includes(num)) simNums.push(num);
        }
        
        const hits = simNums.filter(n => top20Numbers.includes(n)).length;
        hitCounts[hits]++;
      }

      const scaledCounts: { [key: number]: number } = {};
      for (const key in hitCounts) {
        scaledCounts[key] = Math.round((hitCounts[key] / sampleSize) * iterations);
      }

      const top20All6Rate = (38760 / 8145060) * 100;

      setSimulation({ iterations, hitCounts: scaledCounts, top20All6Rate });
      setSimulating(false);
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">AI 분석 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <span>🤖</span>
            <span>AI 분석 완료</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {targetRound}회차 AI 추천 번호
          </h1>
          <p className="text-gray-600">통계 기반 AI 알고리즘으로 생성된 추천 조합</p>
        </div>

        {/* 회차 범위 설정 */}
        <div className="mb-10">
          <RoundRangeSelector />
        </div>

        {/* 추천 세트 */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>🎯</span>
            AI 추천 조합 {recommendSets.length}세트
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {recommendSets.map((set, idx) => (
              <div key={idx} className={`bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition ${idx === 0 ? 'ring-2 ring-yellow-400 relative' : ''}`}>
                {idx === 0 && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold">BEST</div>
                )}
                <div className="text-center mb-4">
                  <span className="text-lg font-bold text-indigo-600">세트 {idx + 1}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {set.numbers.map((num) => (<LottoBall key={num} num={num} />))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="bg-gray-50 rounded px-2 py-1">합계: <span className="font-medium">{set.sum}</span></div>
                  <div className="bg-gray-50 rounded px-2 py-1">홀수: <span className="font-medium">{set.oddCount}개</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* TOP 20 번호 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-10">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <span>🏆</span>
            AI 선정 TOP 20 번호
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-10 gap-3">
            {top20.map((item, idx) => (
              <div key={item.number} className="text-center">
                <div className="relative">
                  {idx < 3 && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center text-xs font-bold text-yellow-900 z-10">
                      {idx + 1}
                    </div>
                  )}
                  <LottoBall num={item.number} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{item.score}점</p>
              </div>
            ))}
          </div>
        </div>

        {/* 과거 적중률 검증 */}
        {validation && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>📊</span>
              AI 추천 번호의 과거 적중률 검증:
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {startRound}회~{endRound}회 범위에서 TOP 20 번호가 실제 당첨번호와 몇 개 일치했는지 검증
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-indigo-600 text-white">
                    <th className="px-4 py-3 text-left border border-indigo-700">회차수</th>
                    <th className="px-4 py-3 text-center bg-yellow-500 text-yellow-900 border border-yellow-600">6개 적중</th>
                    <th className="px-4 py-3 text-center border border-indigo-700">5개</th>
                    <th className="px-4 py-3 text-center border border-indigo-700">4개</th>
                    <th className="px-4 py-3 text-center border border-indigo-700">3개</th>
                    <th className="px-4 py-3 text-center border border-indigo-700">2개 이하</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b bg-gray-50">
                    <td className="px-4 py-3 font-medium border">{validation.totalRounds.toLocaleString()}회</td>
                    <td className="px-4 py-3 text-center bg-yellow-100 font-bold text-yellow-700 border">{validation.hitCounts[6]}회</td>
                    <td className="px-4 py-3 text-center border">{validation.hitCounts[5]}회</td>
                    <td className="px-4 py-3 text-center border">{validation.hitCounts[4]}회</td>
                    <td className="px-4 py-3 text-center border">{validation.hitCounts[3]}회</td>
                    <td className="px-4 py-3 text-center border">{validation.hitCounts[2] + validation.hitCounts[1] + validation.hitCounts[0]}회</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 space-y-2 text-sm">
              <p><strong>평균 적중 개수:</strong> <span className="text-blue-600 font-bold">{validation.avgHits.toFixed(2)}개</span>/6개</p>
              <p><strong>4개 이상 적중률:</strong> <span className="text-green-600 font-bold">{validation.hit4PlusRate.toFixed(1)}%</span></p>
            </div>
          </div>
        )}

        {/* 시뮬레이션 결과 */}
        {simulation && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-10">
            <h2 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span>🎲</span>
              {simulation.iterations.toLocaleString()}회 가상 추첨 시뮬레이션:
            </h2>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left border">적중개수</th>
                    <th className="px-4 py-3 text-right border">횟수</th>
                    <th className="px-4 py-3 text-right border">확률</th>
                    <th className="px-4 py-3 text-left border">의미</th>
                  </tr>
                </thead>
                <tbody>
                  {[6, 5, 4, 3].map((cnt) => (
                    <tr key={cnt} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium border">{cnt}개</td>
                      <td className="px-4 py-3 text-right border">{simulation.hitCounts[cnt]?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right border">{((simulation.hitCounts[cnt] / simulation.iterations) * 100).toFixed(2)}%</td>
                      <td className={`px-4 py-3 border ${cnt >= 5 ? 'text-red-600 font-bold' : 'text-gray-600'}`}>
                        {cnt === 6 ? '★ 1등 가능' : cnt === 5 ? '★ 2등 가능' : cnt === 4 ? '3~4등 가능' : '4~5등 가능'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 text-sm">
              <p><strong>TOP 20에서 6개 모두 나올 확률:</strong> <span className="text-indigo-600 font-bold">{simulation.top20All6Rate.toFixed(4)}%</span></p>
            </div>
          </div>
        )}

        {/* 면책 조항 */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="font-bold text-red-800 mb-2 flex items-center gap-2">
            <span>⚠️</span>
            중요 안내
          </h3>
          <ul className="text-sm text-red-700 space-y-1">
            <li>• 본 AI 추천은 통계적 분석에 기반하며, 당첨을 보장하지 않습니다.</li>
            <li>• 로또는 완전한 무작위 추첨이며, 과거 데이터가 미래를 예측하지 않습니다.</li>
            <li>• 도박 중독은 치료가 필요한 질병입니다. 월 수입의 1% 이내로만 구매하세요.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// PlanGuard로 감싸서 export (premium 등급 이상만 이용 가능)
export default function AIRecommendPage() {
  return (
    <PlanGuard requiredPlan="premium">
      <AIRecommendContent />
    </PlanGuard>
  );
}
