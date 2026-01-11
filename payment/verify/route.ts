import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 가격 정보 (검증용)
const PRICES = {
  premium: { monthly: 3900, yearly: 39000 },
  vip: { monthly: 9900, yearly: 99000 },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, orderId, plan, period, amount } = body;

    // 1. 필수 파라미터 확인
    if (!paymentId || !orderId || !plan || !period || !amount) {
      return NextResponse.json(
        { success: false, message: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 2. 가격 검증
    const expectedPrice = PRICES[plan as keyof typeof PRICES]?.[period as 'monthly' | 'yearly'];
    if (expectedPrice !== amount) {
      return NextResponse.json(
        { success: false, message: '결제 금액이 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 3. 포트원 API로 결제 검증
    const portoneResponse = await fetch(
      `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
      {
        headers: {
          'Authorization': `PortOne ${process.env.PORTONE_API_SECRET}`,
        },
      }
    );

    if (!portoneResponse.ok) {
      const errorData = await portoneResponse.json();
      console.error('PortOne API error:', errorData);
      return NextResponse.json(
        { success: false, message: '결제 정보를 확인할 수 없습니다.' },
        { status: 400 }
      );
    }

    const paymentData = await portoneResponse.json();

    // 4. 결제 상태 확인
    if (paymentData.status !== 'PAID') {
      return NextResponse.json(
        { success: false, message: '결제가 완료되지 않았습니다.' },
        { status: 400 }
      );
    }

    // 5. 결제 금액 재확인
    if (paymentData.amount.total !== amount) {
      return NextResponse.json(
        { success: false, message: '결제 금액이 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // 6. 사용자 ID 추출 (orderId에서)
    const userId = paymentData.customer?.customerId;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: '사용자 정보를 확인할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 7. 구독 기간 계산
    const startDate = new Date();
    const endDate = new Date();
    if (period === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // 8. 구독 정보 업데이트
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (existingSub) {
      // 기존 구독 업데이트
      const { error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          plan: plan,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payment_key: paymentId,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Subscription update error:', updateError);
        return NextResponse.json(
          { success: false, message: '구독 정보 업데이트에 실패했습니다.' },
          { status: 500 }
        );
      }
    } else {
      // 새 구독 생성
      const { error: insertError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: plan,
          status: 'active',
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          payment_key: paymentId,
        });

      if (insertError) {
        console.error('Subscription insert error:', insertError);
        return NextResponse.json(
          { success: false, message: '구독 정보 생성에 실패했습니다.' },
          { status: 500 }
        );
      }
    }

    // 9. 결제 기록 저장 (선택적)
    await supabaseAdmin
      .from('payment_history')
      .insert({
        user_id: userId,
        payment_id: paymentId,
        order_id: orderId,
        plan: plan,
        period: period,
        amount: amount,
        status: 'completed',
      })
      .catch((err) => {
        // 결제 기록 테이블이 없어도 무시
        console.log('Payment history insert skipped:', err.message);
      });

    return NextResponse.json({
      success: true,
      message: '결제가 완료되었습니다.',
      data: {
        plan,
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, message: '결제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
