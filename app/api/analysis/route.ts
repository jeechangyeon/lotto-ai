// ============================================
// 통계 분석 API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { AnalysisService } from '@/services/AnalysisService';
import { Drawing } from '@/types';

// 간단한 메모리 캐시
let analysisCache: { data: any; expiry: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10분

export async function GET(request: NextRequest) {
  try {
    // 캐시 확인
    if (analysisCache && analysisCache.expiry > Date.now()) {
      return NextResponse.json({
        success: true,
        data: analysisCache.data,
        cached: true,
      });
    }

    const supabase = createServerSupabaseClient();

    // 전체 당첨번호 조회
    const { data: drawings, error } = await supabase
      .from('drawings')
      .select('*')
      .order('round_no', { ascending: false });

    if (error || !drawings || drawings.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data available' },
        { status: 404 }
      );
    }

    // 분석 실행
    const analysisService = AnalysisService.getInstance();
    
    // 각 분석 실행
    const frequency = analysisService.calculateFrequency(drawings as Drawing[]);
    const freqArray = Array.from(frequency.entries()).sort((a, b) => b[1] - a[1]);
    
    const hotCold = analysisService.getHotColdNumbers(drawings as Drawing[]);
    const notAppeared = analysisService.getNotAppearedGaps(drawings as Drawing[]);
    const oddEven = analysisService.analyzeOddEven(drawings as Drawing[]);
    const highLow = analysisService.analyzeHighLow(drawings as Drawing[]);
    const sumStats = analysisService.analyzeSum(drawings as Drawing[]);
    const acStats = analysisService.analyzeAC(drawings as Drawing[]);
    const consecutive = analysisService.analyzeConsecutive(drawings as Drawing[]);
    const pairs = analysisService.analyzePairs(drawings as Drawing[]);
    const primeAvg = analysisService.analyzePrime(drawings as Drawing[]);
    const endDigit = analysisService.analyzeEndDigit(drawings as Drawing[]);
    const carryover = analysisService.analyzeCarryover(drawings as Drawing[]);
    const trend = analysisService.analyzeTrend(drawings as Drawing[]);
    const avgGap = analysisService.analyzeGaps(drawings as Drawing[]);
    const colors = analysisService.analyzeColors(drawings as Drawing[]);
    const avgCycle = analysisService.calculateAvgCycle(drawings as Drawing[]);

    const result = {
      latestRound: drawings[0].round_no,
      totalRounds: drawings.length,
      frequency: {
        most: freqArray.slice(0, 5).map(([number, count]) => ({ number, count })),
        least: freqArray.slice(-5).reverse().map(([number, count]) => ({ number, count })),
        all: Object.fromEntries(frequency),
      },
      hotCold,
      notAppeared: notAppeared.slice(0, 10),
      avgCycle,
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
      color: colors,
    };

    // 캐시 저장
    analysisCache = {
      data: result,
      expiry: Date.now() + CACHE_TTL,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Analysis API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
