// ============================================
// AnalysisService - 30가지 통계 분석 서비스
// ============================================

import { Drawing, FullAnalysis, PairAnalysis, PRIME_NUMBERS } from '@/types';
import {
  drawingToNumbers,
  calculateAC,
  countOdd,
  countHigh,
  countConsecutive,
  countCarryover,
  calculateAvgGap,
} from '@/lib/utils';
import { drawingService } from './DrawingService';

export class AnalysisService {
  private static instance: AnalysisService;

  private constructor() {}

  static getInstance(): AnalysisService {
    if (!AnalysisService.instance) {
      AnalysisService.instance = new AnalysisService();
    }
    return AnalysisService.instance;
  }

  /**
   * 1. 전체 출현 빈도 분석
   */
  calculateFrequency(drawings: Drawing[]): Map<number, number> {
    const freq = new Map<number, number>();
    for (let i = 1; i <= 45; i++) freq.set(i, 0);

    drawings.forEach(d => {
      const numbers = drawingToNumbers(d);
      numbers.forEach(n => freq.set(n, (freq.get(n) || 0) + 1));
    });

    return freq;
  }

  /**
   * 2. 최근 N회차 출현 빈도
   */
  calculateRecentFrequency(drawings: Drawing[], n: number = 50): Map<number, number> {
    const recent = drawings.slice(0, n);
    return this.calculateFrequency(recent);
  }

  /**
   * 3. HOT/COLD 번호 분석
   */
  getHotColdNumbers(drawings: Drawing[], recentCount: number = 50): { hot: number[]; cold: number[] } {
    const recentFreq = this.calculateRecentFrequency(drawings, recentCount);
    const sorted = Array.from(recentFreq.entries()).sort((a, b) => b[1] - a[1]);
    
    return {
      hot: sorted.slice(0, 5).map(([num]) => num),
      cold: sorted.slice(-5).reverse().map(([num]) => num),
    };
  }

  /**
   * 4. 미출현 기간 분석
   */
  getNotAppearedGaps(drawings: Drawing[]): { number: number; gap: number }[] {
    const latestRound = drawings[0]?.round_no || 0;
    const lastAppeared = new Map<number, number>();
    
    for (let i = 1; i <= 45; i++) lastAppeared.set(i, 0);
    
    // 가장 최근에 나온 회차 찾기
    for (const d of drawings) {
      const numbers = drawingToNumbers(d);
      numbers.forEach(n => {
        if (!lastAppeared.get(n)) {
          lastAppeared.set(n, d.round_no);
        }
      });
    }
    
    const gaps: { number: number; gap: number }[] = [];
    lastAppeared.forEach((round, num) => {
      gaps.push({ number: num, gap: latestRound - round });
    });
    
    return gaps.sort((a, b) => b.gap - a.gap);
  }

  /**
   * 5. 출현 주기 분석
   */
  calculateAvgCycle(drawings: Drawing[]): number {
    const sortedDrawings = [...drawings].sort((a, b) => a.round_no - b.round_no);
    let totalGaps = 0;
    let gapCount = 0;
    
    for (let num = 1; num <= 45; num++) {
      let lastRound = 0;
      for (const d of sortedDrawings) {
        const numbers = drawingToNumbers(d);
        if (numbers.includes(num)) {
          if (lastRound > 0) {
            totalGaps += d.round_no - lastRound;
            gapCount++;
          }
          lastRound = d.round_no;
        }
      }
    }
    
    return gapCount > 0 ? totalGaps / gapCount : 7.5;
  }

  /**
   * 6. 홀짝 분석
   */
  analyzeOddEven(drawings: Drawing[]): {
    oddRatio: number;
    patterns: Record<string, number>;
    mostCommon: string;
  } {
    let totalOdd = 0;
    let totalCount = 0;
    const patterns: Record<string, number> = {};
    
    drawings.forEach(d => {
      const numbers = drawingToNumbers(d);
      const oddCount = countOdd(numbers);
      totalOdd += oddCount;
      totalCount += 6;
      
      const pattern = `${oddCount}:${6 - oddCount}`;
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    });
    
    const mostCommon = Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '3:3';
    
    return {
      oddRatio: totalOdd / totalCount,
      patterns,
      mostCommon,
    };
  }

  /**
   * 7. 고저 분석 (1-22 저, 23-45 고)
   */
  analyzeHighLow(drawings: Drawing[]): {
    lowRatio: number;
    highRatio: number;
    mostCommon: string;
  } {
    let totalLow = 0;
    let totalHigh = 0;
    const patterns: Record<string, number> = {};
    
    drawings.forEach(d => {
      const numbers = drawingToNumbers(d);
      const highCount = countHigh(numbers);
      const lowCount = 6 - highCount;
      totalLow += lowCount;
      totalHigh += highCount;
      
      const pattern = `${lowCount}:${highCount}`;
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    });
    
    const total = drawings.length * 6;
    const mostCommon = Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || '3:3';
    
    return {
      lowRatio: totalLow / total,
      highRatio: totalHigh / total,
      mostCommon,
    };
  }

  /**
   * 8. 색상 패턴 분석
   */
  analyzeColors(drawings: Drawing[]): Record<string, number> {
    const colors = { yellow: 0, blue: 0, red: 0, gray: 0, green: 0 };
    let total = 0;
    
    drawings.forEach(d => {
      const numbers = drawingToNumbers(d);
      numbers.forEach(n => {
        total++;
        if (n <= 10) colors.yellow++;
        else if (n <= 20) colors.blue++;
        else if (n <= 30) colors.red++;
        else if (n <= 40) colors.gray++;
        else colors.green++;
      });
    });
    
    return {
      yellow: colors.yellow / total,
      blue: colors.blue / total,
      red: colors.red / total,
      gray: colors.gray / total,
      green: colors.green / total,
    };
  }

  /**
   * 9. 구간 분포 분석
   */
  analyzeRanges(drawings: Drawing[]): number[] {
    const ranges = [0, 0, 0, 0, 0];
    let total = 0;
    
    drawings.forEach(d => {
      const numbers = drawingToNumbers(d);
      numbers.forEach(n => {
        total++;
        if (n <= 10) ranges[0]++;
        else if (n <= 20) ranges[1]++;
        else if (n <= 30) ranges[2]++;
        else if (n <= 40) ranges[3]++;
        else ranges[4]++;
      });
    });
    
    return ranges.map(r => r / total);
  }

  /**
   * 10. 연속번호 분석
   */
  analyzeConsecutive(drawings: Drawing[]): {
    hasConsecutiveRatio: number;
    avgCount: number;
  } {
    let hasConsecutive = 0;
    let totalConsecutive = 0;
    
    drawings.forEach(d => {
      const numbers = drawingToNumbers(d);
      const count = countConsecutive(numbers);
      if (count > 0) hasConsecutive++;
      totalConsecutive += count;
    });
    
    return {
      hasConsecutiveRatio: hasConsecutive / drawings.length,
      avgCount: totalConsecutive / drawings.length,
    };
  }

  /**
   * 11. AC값 분석
   */
  analyzeAC(drawings: Drawing[]): {
    average: number;
    distribution: Record<number, number>;
    current: number;
  } {
    const distribution: Record<number, number> = {};
    let total = 0;
    let current = 0;
    
    drawings.forEach((d, idx) => {
      const numbers = drawingToNumbers(d);
      const ac = calculateAC(numbers);
      distribution[ac] = (distribution[ac] || 0) + 1;
      total += ac;
      if (idx === 0) current = ac;
    });
    
    return {
      average: total / drawings.length,
      distribution,
      current,
    };
  }

  /**
   * 12. 합계 분석
   */
  analyzeSum(drawings: Drawing[]): {
    average: number;
    min: number;
    max: number;
    recommended: { min: number; max: number };
  } {
    const sums = drawings.map(d => {
      const numbers = drawingToNumbers(d);
      return numbers.reduce((a, b) => a + b, 0);
    });
    
    const avg = sums.reduce((a, b) => a + b, 0) / sums.length;
    const sorted = [...sums].sort((a, b) => a - b);
    
    return {
      average: Math.round(avg),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      recommended: {
        min: Math.round(avg - 23),
        max: Math.round(avg + 23),
      },
    };
  }

  /**
   * 13. 소수 분석
   */
  analyzePrime(drawings: Drawing[]): number {
    let total = 0;
    
    drawings.forEach(d => {
      const numbers = drawingToNumbers(d);
      total += numbers.filter(n => PRIME_NUMBERS.includes(n)).length;
    });
    
    return total / drawings.length;
  }

  /**
   * 14. 끝수 분석
   */
  analyzeEndDigit(drawings: Drawing[]): { most: number; least: number } {
    const endDigits: Record<number, number> = {};
    for (let i = 0; i <= 9; i++) endDigits[i] = 0;
    
    drawings.forEach(d => {
      const numbers = drawingToNumbers(d);
      numbers.forEach(n => {
        endDigits[n % 10]++;
      });
    });
    
    const sorted = Object.entries(endDigits).sort((a, b) => b[1] - a[1]);
    
    return {
      most: parseInt(sorted[0][0]),
      least: parseInt(sorted[sorted.length - 1][0]),
    };
  }

  /**
   * 15. 동반출현 분석
   */
  analyzePairs(drawings: Drawing[]): PairAnalysis[] {
    const pairs = new Map<string, number>();
    
    drawings.forEach(d => {
      const numbers = drawingToNumbers(d);
      for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const key = `${numbers[i]}-${numbers[j]}`;
          pairs.set(key, (pairs.get(key) || 0) + 1);
        }
      }
    });
    
    return Array.from(pairs.entries())
      .map(([key, count]) => {
        const [a, b] = key.split('-').map(Number);
        return { pair: [a, b] as [number, number], count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * 16. 이월수 분석
   */
  analyzeCarryover(drawings: Drawing[]): {
    zero: number;
    one: number;
    twoPlus: number;
  } {
    const result = { zero: 0, one: 0, twoPlus: 0 };
    
    for (let i = 0; i < drawings.length - 1; i++) {
      const current = drawingToNumbers(drawings[i]);
      const previous = drawingToNumbers(drawings[i + 1]);
      const carryover = countCarryover(current, previous);
      
      if (carryover === 0) result.zero++;
      else if (carryover === 1) result.one++;
      else result.twoPlus++;
    }
    
    const total = drawings.length - 1;
    return {
      zero: result.zero / total,
      one: result.one / total,
      twoPlus: result.twoPlus / total,
    };
  }

  /**
   * 17. 추세 분석 (최근 출현 증가/감소)
   */
  analyzeTrend(drawings: Drawing[]): { rising: number[]; falling: number[] } {
    const recent50 = this.calculateRecentFrequency(drawings, 50);
    const older50 = this.calculateRecentFrequency(drawings.slice(50), 50);
    
    const trends: { number: number; change: number }[] = [];
    
    for (let num = 1; num <= 45; num++) {
      const recentCount = recent50.get(num) || 0;
      const olderCount = older50.get(num) || 0;
      trends.push({ number: num, change: recentCount - olderCount });
    }
    
    const sorted = trends.sort((a, b) => b.change - a.change);
    
    return {
      rising: sorted.slice(0, 5).map(t => t.number),
      falling: sorted.slice(-5).reverse().map(t => t.number),
    };
  }

  /**
   * 18. 번호 간격 분석
   */
  analyzeGaps(drawings: Drawing[]): number {
    let totalGap = 0;
    let gapCount = 0;
    
    drawings.forEach(d => {
      const numbers = drawingToNumbers(d).sort((a, b) => a - b);
      for (let i = 0; i < numbers.length - 1; i++) {
        totalGap += numbers[i + 1] - numbers[i];
        gapCount++;
      }
    });
    
    return totalGap / gapCount;
  }

  /**
   * 19. 쌍수/대칭수 분석
   */
  analyzeSpecialNumbers(drawings: Drawing[]): {
    doubleCount: number;
    symmetricCount: number;
  } {
    const doubles = [11, 22, 33, 44];
    let doubleCount = 0;
    let symmetricCount = 0;
    
    drawings.forEach(d => {
      const numbers = drawingToNumbers(d);
      
      // 쌍수 (11, 22, 33, 44)
      if (numbers.some(n => doubles.includes(n))) doubleCount++;
      
      // 대칭쌍 (합이 46: 1-45, 2-44, ...)
      for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          if (numbers[i] + numbers[j] === 46) {
            symmetricCount++;
            break;
          }
        }
      }
    });
    
    return { doubleCount, symmetricCount };
  }

  /**
   * 전체 분석 실행
   */
  async runFullAnalysis(): Promise<FullAnalysis> {
    const drawings = await drawingService.getAllDrawings();
    
    if (drawings.length === 0) {
      throw new Error('No drawing data available');
    }

    const frequency = this.calculateFrequency(drawings);
    const freqArray = Array.from(frequency.entries()).sort((a, b) => b[1] - a[1]);
    
    const hotCold = this.getHotColdNumbers(drawings);
    const notAppeared = this.getNotAppearedGaps(drawings);
    const oddEven = this.analyzeOddEven(drawings);
    const highLow = this.analyzeHighLow(drawings);
    const sumStats = this.analyzeSum(drawings);
    const acStats = this.analyzeAC(drawings);
    const consecutive = this.analyzeConsecutive(drawings);
    const pairs = this.analyzePairs(drawings);
    const primeAvg = this.analyzePrime(drawings);
    const endDigit = this.analyzeEndDigit(drawings);
    const carryover = this.analyzeCarryover(drawings);
    const trend = this.analyzeTrend(drawings);
    const avgGap = this.analyzeGaps(drawings);
    const colors = this.analyzeColors(drawings);

    return {
      latestRound: drawings[0].round_no,
      totalRounds: drawings.length,
      frequency: {
        most: freqArray.slice(0, 5).map(([number, count]) => ({ number, count })),
        least: freqArray.slice(-5).reverse().map(([number, count]) => ({ number, count })),
      },
      hotCold,
      notAppeared: notAppeared.slice(0, 5),
      oddEven: {
        oddRatio: oddEven.oddRatio,
        evenRatio: 1 - oddEven.oddRatio,
        mostCommonPattern: oddEven.mostCommon,
        patternDistribution: oddEven.patterns,
      },
      highLow: {
        lowRatio: highLow.lowRatio,
        highRatio: highLow.highRatio,
        mostCommonPattern: highLow.mostCommon,
      },
      sumRange: sumStats,
      acValue: acStats,
      consecutive: {
        hasConsecutiveRatio: consecutive.hasConsecutiveRatio,
        avgConsecutiveCount: consecutive.avgCount,
      },
      pairs,
      primeCount: primeAvg,
      endDigit,
      carryover,
      trend,
      avgGap,
      color: colors as any,
    };
  }
}

export const analysisService = AnalysisService.getInstance();
