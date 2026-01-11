// ============================================
// AIRecommendService - AI 번호 추천 서비스
// ============================================

import { Drawing, NumberStats, AIRecommendation, SimulationResult } from '@/types';
import {
  drawingToNumbers,
  calculateAC,
  countOdd,
  countHigh,
  countConsecutive,
  combinations,
} from '@/lib/utils';
import { drawingService } from './DrawingService';
import { analysisService } from './AnalysisService';

export class AIRecommendService {
  private static instance: AIRecommendService;

  private constructor() {}

  static getInstance(): AIRecommendService {
    if (!AIRecommendService.instance) {
      AIRecommendService.instance = new AIRecommendService();
    }
    return AIRecommendService.instance;
  }

  /**
   * AI 점수 계산을 위한 가중치
   */
  private readonly WEIGHTS = {
    notAppearedGap: 0.25,    // 미출현 기간 (오래될수록 점수 높음)
    recentHot: 0.20,         // 최근 HOT 번호
    trend: 0.15,             // 상승 추세
    frequency: 0.15,         // 전체 출현 빈도
    pair: 0.10,              // 동반출현 보너스
    prizeOptimize: 0.15,     // 당첨금 최적화 (고번호 선호)
  };

  /**
   * 각 번호의 AI 점수 계산
   */
  async calculateScores(drawings: Drawing[]): Promise<NumberStats[]> {
    const scores: NumberStats[] = [];
    const latestRound = drawings[0]?.round_no || 0;

    // 1. 전체 출현 빈도
    const frequency = analysisService.calculateFrequency(drawings);
    const maxFreq = Math.max(...frequency.values());
    const minFreq = Math.min(...frequency.values());

    // 2. 최근 50회 출현 빈도
    const recentFreq = analysisService.calculateRecentFrequency(drawings, 50);
    const maxRecent = Math.max(...recentFreq.values());

    // 3. 미출현 기간
    const notAppeared = analysisService.getNotAppearedGaps(drawings);
    const gapMap = new Map(notAppeared.map(n => [n.number, n.gap]));
    const maxGap = Math.max(...gapMap.values());

    // 4. 추세 분석
    const trend = analysisService.analyzeTrend(drawings);
    const risingSet = new Set(trend.rising);

    // 5. 동반출현 분석
    const pairs = analysisService.analyzePairs(drawings);
    const pairBonus = new Map<number, number>();
    pairs.forEach(p => {
      pairBonus.set(p.pair[0], (pairBonus.get(p.pair[0]) || 0) + p.count);
      pairBonus.set(p.pair[1], (pairBonus.get(p.pair[1]) || 0) + p.count);
    });
    const maxPairBonus = Math.max(...pairBonus.values());

    // 각 번호별 점수 계산
    for (let num = 1; num <= 45; num++) {
      const freq = frequency.get(num) || 0;
      const recent = recentFreq.get(num) || 0;
      const gap = gapMap.get(num) || 0;
      const isRising = risingSet.has(num);
      const pairScore = pairBonus.get(num) || 0;
      const isHighNumber = num >= 32;

      // 정규화된 점수 계산
      let score = 0;

      // 미출현 기간 점수 (오래될수록 높음)
      score += (gap / maxGap) * this.WEIGHTS.notAppearedGap * 100;

      // 최근 HOT 점수
      score += (recent / maxRecent) * this.WEIGHTS.recentHot * 100;

      // 추세 보너스
      if (isRising) {
        score += this.WEIGHTS.trend * 100;
      }

      // 전체 빈도 점수 (중간값 선호)
      const freqNorm = 1 - Math.abs((freq - (maxFreq + minFreq) / 2) / ((maxFreq - minFreq) / 2));
      score += freqNorm * this.WEIGHTS.frequency * 100;

      // 동반출현 보너스
      score += (pairScore / maxPairBonus) * this.WEIGHTS.pair * 100;

      // 당첨금 최적화 (고번호 선호, 생일번호 회피)
      if (isHighNumber) {
        score += this.WEIGHTS.prizeOptimize * 100;
      } else if (num <= 12) {
        score -= this.WEIGHTS.prizeOptimize * 50; // 생일번호 패널티
      }

      // 마지막 출현 회차 계산
      let lastAppeared = 0;
      for (const d of drawings) {
        if (drawingToNumbers(d).includes(num)) {
          lastAppeared = d.round_no;
          break;
        }
      }

      // 평균 간격 계산
      let gapSum = 0;
      let gapCount = 0;
      let prevRound = 0;
      for (const d of [...drawings].reverse()) {
        if (drawingToNumbers(d).includes(num)) {
          if (prevRound > 0) {
            gapSum += d.round_no - prevRound;
            gapCount++;
          }
          prevRound = d.round_no;
        }
      }

      scores.push({
        number: num,
        frequency: freq,
        lastAppeared: latestRound - lastAppeared,
        avgGap: gapCount > 0 ? gapSum / gapCount : 7.5,
        score: Math.round(score * 10) / 10,
      });
    }

    // 점수순 정렬 후 1위를 100점으로 정규화
    const sorted = scores.sort((a, b) => b.score - a.score);
    const maxScore = sorted[0].score;
    
    return sorted.map(s => ({
      ...s,
      score: Math.round((s.score / maxScore) * 1000) / 10,
    }));
  }

  /**
   * TOP 20 번호풀 선정
   */
  async getTop20Numbers(drawings?: Drawing[]): Promise<NumberStats[]> {
    const data = drawings || await drawingService.getAllDrawings();
    const scores = await this.calculateScores(data);
    return scores.slice(0, 20);
  }

  /**
   * 유효한 조합인지 검사
   */
  private isValidCombination(numbers: number[]): boolean {
    const sorted = [...numbers].sort((a, b) => a - b);
    
    // 1. 합계 범위 (115-160 권장)
    const sum = sorted.reduce((a, b) => a + b, 0);
    if (sum < 100 || sum > 180) return false;

    // 2. AC값 (7 이상 권장)
    const ac = calculateAC(sorted);
    if (ac < 7) return false;

    // 3. 홀짝 균형 (2:4 ~ 4:2)
    const oddCount = countOdd(sorted);
    if (oddCount < 2 || oddCount > 4) return false;

    // 4. 고저 균형 (2:4 ~ 4:2)
    const highCount = countHigh(sorted);
    if (highCount < 2 || highCount > 4) return false;

    // 5. 연속번호 3개 이상 불가
    const consec = countConsecutive(sorted);
    if (consec >= 3) return false;

    // 6. 끝수 중복 3개 이상 불가
    const endDigits = sorted.map(n => n % 10);
    const endDigitCount = new Map<number, number>();
    endDigits.forEach(d => endDigitCount.set(d, (endDigitCount.get(d) || 0) + 1));
    if (Math.max(...endDigitCount.values()) >= 3) return false;

    return true;
  }

  /**
   * 5세트 추천 번호 생성
   */
  async generateRecommendedSets(
    top20: NumberStats[],
    setCount: number = 5
  ): Promise<number[][]> {
    const numbers = top20.map(n => n.number);
    const sets: number[][] = [];
    
    // 가능한 모든 6개 조합 생성 (C(20,6) = 38,760)
    const allCombinations = combinations(numbers, 6);
    
    // 유효한 조합만 필터링
    const validCombinations = allCombinations.filter(combo => 
      this.isValidCombination(combo)
    );

    // 점수 기반 정렬 (높은 점수 번호가 많은 조합 우선)
    const scoreMap = new Map(top20.map(n => [n.number, n.score]));
    
    validCombinations.sort((a, b) => {
      const scoreA = a.reduce((sum, n) => sum + (scoreMap.get(n) || 0), 0);
      const scoreB = b.reduce((sum, n) => sum + (scoreMap.get(n) || 0), 0);
      return scoreB - scoreA;
    });

    // 다양성을 위해 번호 겹침 최소화하면서 선택
    for (const combo of validCombinations) {
      if (sets.length >= setCount) break;
      
      // 기존 세트와 3개 이상 겹치면 스킵
      const isDiverse = sets.every(existing => {
        const overlap = combo.filter(n => existing.includes(n)).length;
        return overlap <= 3;
      });
      
      if (isDiverse) {
        sets.push(combo.sort((a, b) => a - b));
      }
    }

    // 부족하면 추가 (겹침 허용)
    while (sets.length < setCount && validCombinations.length > 0) {
      const remaining = validCombinations.filter(c => !sets.some(s => 
        JSON.stringify(s) === JSON.stringify(c.sort((a, b) => a - b))
      ));
      if (remaining.length > 0) {
        sets.push(remaining[0].sort((a, b) => a - b));
      } else {
        break;
      }
    }

    return sets;
  }

  /**
   * AI 추천 전체 실행
   */
  async generateRecommendation(): Promise<AIRecommendation> {
    const drawings = await drawingService.getAllDrawings();
    const latestRound = drawings[0]?.round_no || 0;
    
    const top20 = await this.getTop20Numbers(drawings);
    const sets = await this.generateRecommendedSets(top20);
    
    const allScores = await this.calculateScores(drawings);
    const scoresMap: Record<number, number> = {};
    allScores.forEach(s => { scoresMap[s.number] = s.score; });

    return {
      targetRound: latestRound + 1,
      top20Numbers: top20,
      recommendedSets: sets,
      scores: scoresMap,
    };
  }

  /**
   * 과거 적중률 검증
   */
  async validatePastAccuracy(drawings: Drawing[]): Promise<{
    distribution: Record<number, number>;
    avgMatch: number;
    fourPlusRate: number;
  }> {
    const distribution: Record<number, number> = {
      6: 0, 5: 0, 4: 0, 3: 0, 2: 0, 1: 0, 0: 0
    };
    let totalMatches = 0;
    let checked = 0;

    // 각 회차에 대해 해당 시점까지의 데이터로 추천 생성 후 검증
    for (let i = 50; i < drawings.length; i++) {
      const historicalData = drawings.slice(i);
      const actual = drawingToNumbers(drawings[i - 1]);
      
      try {
        const scores = await this.calculateScores(historicalData);
        const top20 = scores.slice(0, 20).map(s => s.number);
        
        const matchCount = actual.filter(n => top20.includes(n)).length;
        distribution[matchCount]++;
        totalMatches += matchCount;
        checked++;
      } catch {
        continue;
      }
    }

    const fourPlus = distribution[6] + distribution[5] + distribution[4];
    
    return {
      distribution,
      avgMatch: checked > 0 ? totalMatches / checked : 0,
      fourPlusRate: checked > 0 ? fourPlus / checked : 0,
    };
  }

  /**
   * 시뮬레이션 실행
   */
  async runSimulation(
    top20: number[],
    iterations: number = 100000
  ): Promise<SimulationResult> {
    const distribution = {
      six: 0,
      five: 0,
      four: 0,
      three: 0,
      twoOrLess: 0,
    };

    for (let i = 0; i < iterations; i++) {
      // 가상 추첨 (1-45에서 6개 랜덤)
      const drawn: number[] = [];
      const available = Array.from({ length: 45 }, (_, i) => i + 1);
      
      for (let j = 0; j < 6; j++) {
        const idx = Math.floor(Math.random() * available.length);
        drawn.push(available[idx]);
        available.splice(idx, 1);
      }

      // TOP 20과 매칭
      const matches = drawn.filter(n => top20.includes(n)).length;
      
      if (matches === 6) distribution.six++;
      else if (matches === 5) distribution.five++;
      else if (matches === 4) distribution.four++;
      else if (matches === 3) distribution.three++;
      else distribution.twoOrLess++;
    }

    const fourPlus = distribution.six + distribution.five + distribution.four;
    const totalMatches = 
      distribution.six * 6 + 
      distribution.five * 5 + 
      distribution.four * 4 + 
      distribution.three * 3;

    return {
      totalSimulations: iterations,
      matchDistribution: distribution,
      hitRate: {
        fourPlus: fourPlus / iterations,
        average: totalMatches / iterations,
      },
    };
  }
}

export const aiRecommendService = AIRecommendService.getInstance();
