// ============================================
// 당첨번호 조회 API
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

// DB 데이터를 프론트엔드 형식으로 변환
function transformDrawing(row: any) {
  return {
    round: row.round_no,
    date: row.draw_date,
    numbers: [row.num1, row.num2, row.num3, row.num4, row.num5, row.num6],
    bonus: row.bonus,
    prize1st: row.prize_1st || 0,
    winners1st: row.winners_1st || 0,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const roundNo = searchParams.get('round');
    const all = searchParams.get('all'); // 전체 데이터 요청

    const supabase = createServerSupabaseClient();

    // 특정 회차 조회
    if (roundNo) {
      const { data, error } = await supabase
        .from('drawings')
        .select('*')
        .eq('round_no', parseInt(roundNo))
        .single();

      if (error || !data) {
        return NextResponse.json(
          { success: false, error: 'Drawing not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: transformDrawing(data) });
    }

    // 전체 데이터 요청 (all=true)
    if (all === 'true') {
      const allData: any[] = [];
      let from = 0;
      const batchSize = 1000;
      
      // 1000개씩 반복해서 전체 데이터 가져오기
      while (true) {
        const { data, error } = await supabase
          .from('drawings')
          .select('*')
          .order('round_no', { ascending: false })
          .range(from, from + batchSize - 1);

        if (error) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
          );
        }

        if (!data || data.length === 0) break;
        
        allData.push(...data);
        
        // 다 가져왔으면 종료
        if (data.length < batchSize) break;
        
        from += batchSize;
      }

      const transformedData = allData.map(transformDrawing);

      return NextResponse.json({
        success: true,
        data: transformedData,
        meta: {
          total: allData.length,
        },
      });
    }

    // 일반 페이지네이션 조회
    const offset = (page - 1) * limit;
    
    const { data, error, count } = await supabase
      .from('drawings')
      .select('*', { count: 'exact' })
      .order('round_no', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // 데이터 변환
    const transformedData = (data || []).map(transformDrawing);

    return NextResponse.json({
      success: true,
      data: transformedData,
      meta: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 당첨번호 추가 (관리자용)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('drawings')
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
