'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  nickname: string;
  phone: string | null;
}

interface Subscription {
  id: string;
  plan: 'free' | 'premium' | 'vip';
  status: 'active' | 'canceled' | 'expired';
  start_date: string;
  end_date: string | null;
}

// 등급별 설정
export const PLAN_CONFIG = {
  free: {
    name: 'FREE',
    minRound: 1,
    maxRound: 500,
    aiSets: 0,
    color: 'bg-gray-200 text-gray-700',
    features: ['당첨번호 조회', '기본 통계 분석', '1~500회차 분석'],
  },
  premium: {
    name: 'Premium',
    minRound: 501,
    maxRound: 1000,
    aiSets: 2,
    color: 'bg-blue-500 text-white',
    features: ['당첨번호 조회', '기본 통계 분석', '501~1000회차 분석', 'AI 추천 2세트', '과거 적중률 검증', '시뮬레이션 결과'],
  },
  vip: {
    name: 'VIP',
    minRound: 1,
    maxRound: 99999, // 전체
    aiSets: 5,
    color: 'bg-yellow-500 text-yellow-900',
    features: ['당첨번호 조회', '기본 통계 분석', '전체 회차 분석', 'AI 추천 5세트', '과거 적중률 검증', '시뮬레이션 결과', '우선 고객 지원', '신규 기능 우선 이용'],
  },
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  loading: boolean;
  plan: 'free' | 'premium' | 'vip';
  planConfig: typeof PLAN_CONFIG.free;
  signUp: (email: string, password: string, nickname: string, phone: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // 현재 플랜
  const plan = subscription?.plan || 'free';
  const planConfig = PLAN_CONFIG[plan];

  // 프로필 가져오기
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      // 프로필이 없으면 자동 로그아웃 (삭제된 계정)
      console.log('Profile not found, logging out...');
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSubscription(null);
      // 회원가입 페이지로 이동
      if (typeof window !== 'undefined') {
        alert('계정 정보가 없습니다. 회원가입을 진행해주세요.');
        window.location.href = '/auth/signup';
      }
      return false;
    }
    
    setProfile(data as UserProfile);
    return true;
  };

  // 구독 정보 가져오기
  const fetchSubscription = async (userId: string) => {
    console.log('Fetching subscription for user:', userId);
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    console.log('Subscription result:', { data, error });

    if (!error && data) {
      setSubscription(data as Subscription);
      console.log('Subscription set:', data);
    } else {
      console.log('No subscription found, creating default...');
      // 구독 정보가 없으면 기본값 생성
      const { data: newSub, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan: 'free',
          status: 'active',
        })
        .select()
        .single();
      
      if (!insertError && newSub) {
        setSubscription(newSub as Subscription);
        console.log('Default subscription created:', newSub);
      }
    }
  };

  // 초기 세션 확인
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          const hasProfile = await fetchProfile(session.user.id);
          if (hasProfile) {
            await fetchSubscription(session.user.id);
          }
          // 프로필 없으면 fetchProfile에서 이미 로그아웃 처리됨
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // 인증 상태 변경 리스너
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          const hasProfile = await fetchProfile(session.user.id);
          if (hasProfile) {
            await fetchSubscription(session.user.id);
          }
        } else {
          setUser(null);
          setProfile(null);
          setSubscription(null);
        }
        setLoading(false);
      }
    );

    return () => {
      authSubscription.unsubscribe();
    };
  }, []);

  // 회원가입
  const signUp = async (email: string, password: string, nickname: string, phone: string) => {
    try {
      // 1. Supabase Auth 회원가입
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data.user) {
        // 2. 프로필 생성
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: data.user.id,
            email,
            nickname,
            phone: phone || null,
          });

        if (profileError) throw profileError;
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // 로그인
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 에러가 나도 상태는 초기화
      setUser(null);
      setProfile(null);
      setSubscription(null);
      // 로컬스토리지 정리
      localStorage.removeItem('lotto_start_round');
      localStorage.removeItem('lotto_end_round');
    }
  };

  // 프로필 업데이트
  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!user) return { error: new Error('로그인이 필요합니다.') };

    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(data)
        .eq('id', user.id);

      if (error) throw error;

      // 로컬 상태 업데이트
      setProfile((prev) => prev ? { ...prev, ...data } : null);
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  // 구독 정보 새로고침
  const refreshSubscription = async () => {
    if (user) {
      await fetchSubscription(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        subscription,
        loading,
        plan,
        planConfig,
        signUp,
        signIn,
        signOut,
        updateProfile,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
