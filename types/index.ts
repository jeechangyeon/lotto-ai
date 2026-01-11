// ============================================
// 로또 AI 분석 서비스 - TypeScript 타입 정의
// ============================================

// 당첨번호 데이터 타입
export interface Drawing {
  id: number;
  round_no: number;
  draw_date: string;
  num1: number;
  num2: number;
  num3: number;
  num4: number;
  num5: number;
  num6: number;
  bonus: number;
  total_sum: number;
  odd_count: number;
  prize_1st?: number;
  winners_1st?: number;
  created_at?: string;
}

// 번호 배열 형태
export interface DrawingNumbers {
  numbers: number[];
  bonus: number;
}

// 번호별 통계
export interface NumberStats {
  number: number;
  frequency: number;
  lastAppeared: number;
  avgGap: number;
  score: number;
}

// 출현 빈도 분석
export interface FrequencyAnalysis {
  overall: Map<number, number>;
  recent50: Map<number, number>;
  hot: number[];
  cold: number[];
}

// 홀짝 분석
export interface OddEvenAnalysis {
  oddRatio: number;
  evenRatio: number;
  mostCommonPattern: string;
  patternDistribution: Record<string, number>;
}

// 고저 분석
export interface HighLowAnalysis {
  lowRatio: number;
  highRatio: number;
  mostCommonPattern: string;
}

// AC값 분석
export interface ACAnalysis {
  average: number;
  distribution: Record<number, number>;
  current: number;
}

// 연속번호 분석
export interface ConsecutiveAnalysis {
  hasConsecutiveRatio: number;
  avgConsecutiveCount: number;
}

// 동반출현 분석
export interface PairAnalysis {
  pair: [number, number];
  count: number;
}

// 색상 분석 (로또 공 색상)
export interface ColorAnalysis {
  yellow: number;  // 1-10
  blue: number;    // 11-20
  red: number;     // 21-30
  gray: number;    // 31-40
  green: number;   // 41-45
}

// 종합 분석 결과
export interface FullAnalysis {
  latestRound: number;
  totalRounds: number;
  frequency: {
    most: { number: number; count: number }[];
    least: { number: number; count: number }[];
  };
  hotCold: {
    hot: number[];
    cold: number[];
  };
  notAppeared: { number: number; gap: number }[];
  oddEven: OddEvenAnalysis;
  highLow: HighLowAnalysis;
  sumRange: {
    average: number;
    min: number;
    max: number;
    recommended: { min: number; max: number };
  };
  acValue: ACAnalysis;
  consecutive: ConsecutiveAnalysis;
  pairs: PairAnalysis[];
  primeCount: number;
  endDigit: { most: number; least: number };
  carryover: { zero: number; one: number; twoPlus: number };
  trend: { rising: number[]; falling: number[] };
  avgGap: number;
  color: ColorAnalysis;
}

// AI 추천 결과
export interface AIRecommendation {
  id?: number;
  targetRound: number;
  top20Numbers: NumberStats[];
  recommendedSets: number[][];
  scores: Record<number, number>;
  createdAt?: string;
}

// 시뮬레이션 결과
export interface SimulationResult {
  totalSimulations: number;
  matchDistribution: {
    six: number;
    five: number;
    four: number;
    three: number;
    twoOrLess: number;
  };
  hitRate: {
    fourPlus: number;
    average: number;
  };
}

// 과거 검증 결과
export interface ValidationResult {
  round: number;
  actual: number[];
  predicted: number[];
  matchCount: number;
  matched: number[];
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

// 페이지네이션 파라미터
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 번호 색상 매핑
export const BALL_COLORS: Record<string, string> = {
  yellow: '#FDB813',  // 1-10
  blue: '#69C8F2',    // 11-20
  red: '#FF6B6B',     // 21-30
  gray: '#AAAAAA',    // 31-40
  green: '#7BC47F',   // 41-45
};

// 번호별 색상 반환 함수
export function getBallColor(num: number): string {
  if (num <= 10) return BALL_COLORS.yellow;
  if (num <= 20) return BALL_COLORS.blue;
  if (num <= 30) return BALL_COLORS.red;
  if (num <= 40) return BALL_COLORS.gray;
  return BALL_COLORS.green;
}

// 소수 목록
export const PRIME_NUMBERS = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43];
