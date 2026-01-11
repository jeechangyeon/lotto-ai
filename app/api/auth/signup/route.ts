import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service Role 키로 Supabase 클라이언트 생성 (RLS 우회)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { email, password, nickname, phone } = await request.json();

    // 유효성 검사
    if (!email || !password || !nickname) {
      return NextResponse.json(
        { error: '필수 정보를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 1. Supabase Auth 회원가입
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 이메일 인증 자동 완료
    });

    if (authError) {
      console.error('Auth error:', authError);
      
      if (authError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: '이미 가입된 이메일입니다.' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: '사용자 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 2. 프로필 생성 (Service Role로 RLS 우회)
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        email,
        nickname,
        phone: phone || null,
      });

    if (profileError) {
      console.error('Profile error:', profileError);
      
      // 프로필 생성 실패 시 사용자 삭제
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      
      return NextResponse.json(
        { error: '프로필 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 3. 기본 구독 생성 (free 플랜)
    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: authData.user.id,
        plan: 'free',
        status: 'active',
      });

    if (subError) {
      console.error('Subscription error:', subError);
      // 구독 생성 실패는 치명적이지 않으므로 무시
    }

    return NextResponse.json({
      success: true,
      message: '회원가입이 완료되었습니다.',
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: '회원가입 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
