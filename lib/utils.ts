// ============================================
// 로또 AI 분석 서비스 - 유틸리티 함수
// ============================================

import { Drawing, PRIME_NUMBERS } from '@/types';

/**
 * 번호 배열에서 Drawing 객체로 변환
 */
export function numbersToDrawing(numbers: number[], bonus: number, roundNo: number): Partial<Drawing> {
  const sorted = [...numbers].sort((a, b) => a - b);
  return {
    round_no: roundNo,
    num1: sorted[0],
    num2: sorted[1],
    num3: sorted[2],
    num4: sorted[3],
    num5: sorted[4],
    num6: sorted[5],
    bonus,
    total_sum: sorted.reduce((a, b) => a + b, 0),
    odd_count: sorted.filter(n => n % 2 === 1).length,
  };
}

/**
 * Drawing 객체에서 번호 배열 추출
 */
export function drawingToNumbers(drawing: Drawing): number[] {
  return [drawing.num1, drawing.num2, drawing.num3, drawing.num4, drawing.num5, drawing.num6];
}

/**
 * AC값 계산 (Arithmetic Complexity)
 * 6개 번호 간 차이값의 고유 개수
 */
export function calculateAC(numbers: number[]): number {
  const differences = new Set<number>();
  const sorted = [...numbers].sort((a, b) => a - b);
  
  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      differences.add(sorted[j] - sorted[i]);
    }
  }
  
  // AC = 고유 차이값 개수 - 5 (최소 차이값 개수)
  return differences.size - 5;
}

/**
 * 홀수 개수 계산
 */
export function countOdd(numbers: number[]): number {
  return numbers.filter(n => n % 2 === 1).length;
}

/**
 * 고번호 개수 계산 (23-45)
 */
export function countHigh(numbers: number[]): number {
  return numbers.filter(n => n >= 23).length;
}

/**
 * 연속번호 쌍 개수 계산
 */
export function countConsecutive(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  let count = 0;
  
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] - sorted[i] === 1) {
      count++;
    }
  }
  
  return count;
}

/**
 * 소수 개수 계산
 */
export function countPrime(numbers: number[]): number {
  return numbers.filter(n => PRIME_NUMBERS.includes(n)).length;
}

/**
 * 끝수(1의 자리) 분포 계산
 */
export function getEndDigitDistribution(numbers: number[]): Record<number, number> {
  const dist: Record<number, number> = {};
  for (let i = 0; i <= 9; i++) dist[i] = 0;
  
  numbers.forEach(n => {
    const endDigit = n % 10;
    dist[endDigit]++;
  });
  
  return dist;
}

/**
 * 번호 구간 분포 계산
 */
export function getRangeDistribution(numbers: number[]): number[] {
  // 1-10, 11-20, 21-30, 31-40, 41-45
  const ranges = [0, 0, 0, 0, 0];
  
  numbers.forEach(n => {
    if (n <= 10) ranges[0]++;
    else if (n <= 20) ranges[1]++;
    else if (n <= 30) ranges[2]++;
    else if (n <= 40) ranges[3]++;
    else ranges[4]++;
  });
  
  return ranges;
}

/**
 * 이월수 계산 (이전 회차에서 반복된 번호)
 */
export function countCarryover(current: number[], previous: number[]): number {
  return current.filter(n => previous.includes(n)).length;
}

/**
 * 번호 간 평균 간격 계산
 */
export function calculateAvgGap(numbers: number[]): number {
  const sorted = [...numbers].sort((a, b) => a - b);
  let totalGap = 0;
  
  for (let i = 0; i < sorted.length - 1; i++) {
    totalGap += sorted[i + 1] - sorted[i];
  }
  
  return totalGap / (sorted.length - 1);
}

/**
 * 두 번호 배열의 일치 개수 계산
 */
export function countMatches(set1: number[], set2: number[]): number {
  return set1.filter(n => set2.includes(n)).length;
}

/**
 * 날짜 포맷팅
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * 숫자 포맷팅 (천 단위 콤마)
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('ko-KR');
}

/**
 * 금액 포맷팅
 */
export function formatMoney(amount: number): string {
  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)}억원`;
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

/**
 * 퍼센트 포맷팅
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 배열 셔플 (Fisher-Yates)
 */
export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 조합 생성 (nCr)
 */
export function combinations<T>(arr: T[], r: number): T[][] {
  const result: T[][] = [];
  
  function combine(start: number, combo: T[]) {
    if (combo.length === r) {
      result.push([...combo]);
      return;
    }
    
    for (let i = start; i < arr.length; i++) {
      combo.push(arr[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }
  
  combine(0, []);
  return result;
}

/**
 * CSS 클래스 병합 유틸리티
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
