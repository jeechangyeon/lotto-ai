import { NextRequest, NextResponse } from 'next/server';
import { AIRecommendService } from '@/services/AIRecommendService';
import { AnalysisService } from '@/services/AnalysisService';
import { DrawingService } from '@/services/DrawingService';

// 캐시 설정
let cachedRecommendation: any = null;
let cacheTime: number = 0;
const CACHE_DURATION = 10 * 60 * 1000; // 10분

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // ✅ 싱글톤 패턴: getInstance() 사용
    const drawingService = DrawingService.getInstance();
    const analysisService = AnalysisService.getInstance();
    const aiService = AIRecommendService.getInstance();

    // 시뮬레이션 요청
    if (action === 'simulate') {
      const iterations = parseInt(searchParams.get('iterations') || '10000');
      const simulation = await aiService.runSimulation(iterations);
      return NextResponse.json({
        success: true,
        data: simulation,
      });
    }

    // 과거 검증 요청
    if (action === 'validate') {
      const rounds = parseInt(searchParams.get('rounds') || '10');
      const validation = await aiService.validatePastAccuracy(rounds);
      return NextResponse.json({
        success: true,
        data: validation,
      });
    }

    // 기본: AI 추천 번호 생성
    const now = Date.now();
    if (cachedRecommendation && (now - cacheTime) < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        data: cachedRecommendation,
        cached: true,
      });
    }

    // 최신 회차 정보
    const latest = await drawingService.getLatestDrawing();
    const targetRound = latest ? latest.round + 1 : 1;

    // 점수 계산
    const scores = await aiService.calculateScores();
    
    // Top 20 번호
    const top20 = await aiService.getTop20Numbers();
    
    // 추천 세트 5개 생성
    const recommendedSets = await aiService.generateRecommendedSets();

    // 각 세트의 상세 정보 계산
    const setsWithDetails = recommendedSets.map((set, index) => {
      const sum = set.reduce((a, b) => a + b, 0);
      const oddCount = set.filter(n => n % 2 === 1).length;
      const highCount = set.filter(n => n >= 23).length;
      const avgScore = set.reduce((acc, n) => {
        const found = scores.find(s => s.number === n);
        return acc + (found?.score || 0);
      }, 0) / 6;

      return {
        setNumber: index + 1,
        numbers: set,
        sum,
        oddCount,
        highCount,
        avgScore: Math.round(avgScore * 100) / 100,
      };
    });

    const recommendation = {
      targetRound,
      generatedAt: new Date().toISOString(),
      top20Numbers: top20,
      allScores: scores,
      recommendedSets: setsWithDetails,
      analysisNote: '이 추천은 통계적 패턴 분석에 기반하며, 당첨을 보장하지 않습니다.',
    };

    // 캐시 업데이트
    cachedRecommendation = recommendation;
    cacheTime = now;

    return NextResponse.json({
      success: true,
      data: recommendation,
      cached: false,
    });

  } catch (error) {
    console.error('AI Recommend API Error:', error);
    return NextResponse.json(
      { success: false, error: 'AI 추천 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
