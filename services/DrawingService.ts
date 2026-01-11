// ============================================
// DrawingService - 당첨번호 데이터 관리 서비스
// ============================================

import { supabase } from '@/lib/supabase';
import { Drawing, PaginationParams, ApiResponse } from '@/types';
import { drawingToNumbers } from '@/lib/utils';

export class DrawingService {
  private static instance: DrawingService;
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private CACHE_TTL = 5 * 60 * 1000; // 5분

  private constructor() {}

  static getInstance(): DrawingService {
    if (!DrawingService.instance) {
      DrawingService.instance = new DrawingService();
    }
    return DrawingService.instance;
  }

  /**
   * 캐시에서 데이터 조회
   */
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 캐시에 데이터 저장
   */
  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.CACHE_TTL,
    });
  }

  /**
   * 전체 당첨번호 조회
   */
  async getAllDrawings(): Promise<Drawing[]> {
    const cacheKey = 'all_drawings';
    const cached = this.getFromCache<Drawing[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('drawings')
      .select('*')
      .order('round_no', { ascending: false });

    if (error) throw new Error(error.message);
    
    this.setCache(cacheKey, data);
    return data || [];
  }

  /**
   * 페이지네이션된 당첨번호 조회
   */
  async getDrawings(params: PaginationParams = {}): Promise<ApiResponse<Drawing[]>> {
    const { page = 1, limit = 20, sortBy = 'round_no', sortOrder = 'desc' } = params;
    const offset = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('drawings')
      .select('*', { count: 'exact' })
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(offset, offset + limit - 1);

    if (error) {
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data || [],
      meta: {
        total: count || 0,
        page,
        limit,
      },
    };
  }

  /**
   * 특정 회차 당첨번호 조회
   */
  async getDrawingByRound(roundNo: number): Promise<Drawing | null> {
    const { data, error } = await supabase
      .from('drawings')
      .select('*')
      .eq('round_no', roundNo)
      .single();

    if (error) return null;
    return data;
  }

  /**
   * 최신 당첨번호 조회
   */
  async getLatestDrawing(): Promise<Drawing | null> {
    const cacheKey = 'latest_drawing';
    const cached = this.getFromCache<Drawing>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('drawings')
      .select('*')
      .order('round_no', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    
    this.setCache(cacheKey, data);
    return data;
  }

  /**
   * 최근 N회차 당첨번호 조회
   */
  async getRecentDrawings(count: number = 10): Promise<Drawing[]> {
    const cacheKey = `recent_${count}`;
    const cached = this.getFromCache<Drawing[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabase
      .from('drawings')
      .select('*')
      .order('round_no', { ascending: false })
      .limit(count);

    if (error) return [];
    
    this.setCache(cacheKey, data);
    return data || [];
  }

  /**
   * 특정 번호가 포함된 회차 조회
   */
  async getDrawingsWithNumber(num: number): Promise<Drawing[]> {
    const allDrawings = await this.getAllDrawings();
    
    return allDrawings.filter(d => {
      const numbers = drawingToNumbers(d);
      return numbers.includes(num) || d.bonus === num;
    });
  }

  /**
   * 특정 번호의 출현 통계
   */
  async getNumberStats(num: number): Promise<{
    totalCount: number;
    asMain: number;
    asBonus: number;
    lastAppeared: number;
    avgGap: number;
  }> {
    const allDrawings = await this.getAllDrawings();
    
    let asMain = 0;
    let asBonus = 0;
    let lastAppeared = 0;
    const gaps: number[] = [];
    let lastRound = 0;

    for (const d of allDrawings.sort((a, b) => a.round_no - b.round_no)) {
      const numbers = drawingToNumbers(d);
      
      if (numbers.includes(num)) {
        asMain++;
        if (lastRound > 0) {
          gaps.push(d.round_no - lastRound);
        }
        lastRound = d.round_no;
        lastAppeared = d.round_no;
      }
      
      if (d.bonus === num) {
        asBonus++;
      }
    }

    const latestRound = allDrawings[0]?.round_no || 0;
    
    return {
      totalCount: asMain + asBonus,
      asMain,
      asBonus,
      lastAppeared: latestRound - lastAppeared,
      avgGap: gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0,
    };
  }

  /**
   * 당첨번호 추가 (관리자용)
   */
  async addDrawing(drawing: Omit<Drawing, 'id' | 'created_at'>): Promise<Drawing | null> {
    const { data, error } = await supabase
      .from('drawings')
      .insert(drawing)
      .select()
      .single();

    if (error) {
      console.error('Failed to add drawing:', error);
      return null;
    }

    // 캐시 무효화
    this.cache.clear();
    
    return data;
  }

  /**
   * 회차 범위로 당첨번호 조회
   */
  async getDrawingsByRange(startRound: number, endRound: number): Promise<Drawing[]> {
    const { data, error } = await supabase
      .from('drawings')
      .select('*')
      .gte('round_no', startRound)
      .lte('round_no', endRound)
      .order('round_no', { ascending: false });

    if (error) return [];
    return data || [];
  }

  /**
   * 캐시 클리어
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const drawingService = DrawingService.getInstance();
