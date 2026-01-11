'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, PLAN_CONFIG } from '@/app/contexts/AuthContext';

export default function PricingPage() {
  const router = useRouter();
  const { user, plan, loading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const plans = {
    free: {
      name: 'FREE',
      price: { monthly: 0, yearly: 0 },
      description: '기본 기능 무료 이용',
      roundRange: '1회 ~ 500회',
      aiSets: 0,
      color: 'border-gray-200 bg-white',
      buttonColor: 'bg-gray-200 text-gray-700 cursor-not-allowed',
      features: [
        { text: '당첨번호 조회', included: true },
        { text: '기본 통계 분석', included: true },
        { text: '1~500회차 분석', included: true },
        { text: 'AI 추천', included: false },
        { text: '과거 적중률 검증', included: false },
        { text: '시뮬레이션 결과', included: false },
      ],
    },
    premium: {
      name: 'Premium',
      price: { monthly: 3900, yearly: 39000 },
      description: '중급 기능 이용',
      roundRange: '501회 ~ 1000회',
      aiSets: 2,
      color: 'border-blue-300 bg-blue-50',
      buttonColor: 'bg-blue-600 text-white hover:bg-blue-700',
      features: [
        { text: '당첨번호 조회', included: true },
        { text: '기본 통계 분석', included: true },
        { text: '501~1000회차 분석', included: true, highlight: true },
        { text: 'AI 추천 2세트', included: true, highlight: true },
        { text: '과거 적중률 검증', included: true, highlight: true },
        { text: '시뮬레이션 결과', included: true, highlight: true },
        { text: '우선 고객 지원', included: true },
      ],
    },
    vip: {
      name: 'VIP',
      price: { monthly: 9900, yearly: 99000 },
      description: '모든 프리미엄 기능',
      roundRange: '전체 (1회 ~ 최신)',
      aiSets: 5,
      color: 'border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50',
      buttonColor: 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:from-yellow-600 hover:to-amber-600',
      badge: '추천',
      features: [
        { text: '당첨번호 조회', included: true },
        { text: '기본 통계 분석', included: true },
        { text: '전체 회차 분석 (ALL)', included: true, highlight: true },
        { text: 'AI 추천 5세트', included: true, highlight: true },
        { text: '과거 적중률 검증', included: true, highlight: true },
        { text: '시뮬레이션 결과', included: true, highlight: true },
        { text: '우선 고객 지원', included: true },
        { text: '신규 기능 우선 이용', included: true, highlight: true },
      ],
    },
  };

  const handleSubscribe = (planKey: 'free' | 'premium' | 'vip') => {
    if (!user) {
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    if (planKey === 'free') return;
    if (plan === planKey) {
      alert('이미 이용 중인 플랜입니다!');
      return;
    }

    // 결제 페이지로 이동
    router.push(`/payment?plan=${planKey}&period=${selectedPeriod}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  const planLevels = { free: 0, premium: 1, vip: 2 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 요금제 선택
          </h1>
          <p className="text-lg text-gray-600 mb-2">
            나에게 맞는 플랜을 선택하세요
          </p>
          {user && (
            <p className="text-sm text-indigo-600">
              현재 등급: <span className={`px-2 py-1 rounded font-bold ${PLAN_CONFIG[plan].color}`}>{PLAN_CONFIG[plan].name}</span>
            </p>
          )}
        </div>

        {/* 기간 토글 */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-xl inline-flex">
            <button
              onClick={() => setSelectedPeriod('monthly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition ${
                selectedPeriod === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              월간 결제
            </button>
            <button
              onClick={() => setSelectedPeriod('yearly')}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition relative ${
                selectedPeriod === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              연간 결제
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                17% 할인
              </span>
            </button>
          </div>
        </div>

        {/* 가격 카드 */}
        <div className="grid md:grid-cols-3 gap-6">
          {(['free', 'premium', 'vip'] as const).map((planKey) => {
            const p = plans[planKey];
            const isCurrentPlan = plan === planKey;
            const canUpgrade = planLevels[planKey] > planLevels[plan];
            
            return (
              <div
                key={planKey}
                className={`rounded-2xl shadow-lg p-6 border-2 relative ${p.color}`}
              >
                {/* 추천 뱃지 */}
                {p.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                    {p.badge}
                  </div>
                )}

                {/* 현재 플랜 표시 */}
                {isCurrentPlan && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                    현재 이용 중
                  </div>
                )}

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{p.name}</h2>
                  <p className="text-gray-500 text-sm">{p.description}</p>
                </div>

                <div className="text-center mb-6">
                  <span className="text-4xl font-bold text-gray-900">
                    ₩{formatPrice(p.price[selectedPeriod])}
                  </span>
                  <span className="text-gray-500 ml-2">
                    / {selectedPeriod === 'monthly' ? '월' : '년'}
                  </span>
                  {selectedPeriod === 'yearly' && p.price.yearly > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      월 ₩{formatPrice(Math.round(p.price.yearly / 12))}
                    </p>
                  )}
                </div>

                {/* 회차 범위 */}
                <div className="bg-gray-100 rounded-lg p-3 mb-4 text-center">
                  <p className="text-xs text-gray-500">분석 가능 회차</p>
                  <p className="font-bold text-gray-800">{p.roundRange}</p>
                </div>

                {/* AI 세트 */}
                {p.aiSets > 0 && (
                  <div className="bg-indigo-100 rounded-lg p-3 mb-4 text-center">
                    <p className="text-xs text-indigo-500">AI 추천</p>
                    <p className="font-bold text-indigo-700">{p.aiSets}세트</p>
                  </div>
                )}

                <ul className="space-y-2 mb-6">
                  {p.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      {feature.included ? (
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                          feature.highlight ? 'bg-green-500 text-white' : 'bg-green-100 text-green-600'
                        }`}>✓</span>
                      ) : (
                        <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs">✗</span>
                      )}
                      <span className={feature.included ? (feature.highlight ? 'font-medium text-gray-900' : 'text-gray-700') : 'text-gray-400'}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(planKey)}
                  disabled={loading || isCurrentPlan || planKey === 'free'}
                  className={`w-full py-3 px-4 rounded-xl font-bold transition ${p.buttonColor} disabled:opacity-50`}
                >
                  {isCurrentPlan ? '현재 플랜' : planKey === 'free' ? '무료' : canUpgrade ? '업그레이드' : '다운그레이드'}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
            자주 묻는 질문
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">등급별 회차 범위가 다른 이유는?</h3>
              <p className="text-gray-600 text-sm">
                각 등급별로 분석 가능한 회차 범위가 다릅니다. FREE는 1~500회, Premium은 501~1000회, VIP는 전체 회차를 분석할 수 있습니다.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">언제든지 업그레이드/해지 가능한가요?</h3>
              <p className="text-gray-600 text-sm">
                네, 마이페이지에서 언제든지 플랜을 변경하거나 해지할 수 있습니다.
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-2">AI 추천이 당첨을 보장하나요?</h3>
              <p className="text-gray-600 text-sm">
                아니요. 로또는 완전한 무작위 추첨이며, AI 추천은 통계적 분석에 기반한 참고용입니다.
              </p>
            </div>
          </div>
        </div>

        {/* 면책 조항 */}
        <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-xl max-w-3xl mx-auto">
          <p className="text-sm text-amber-800 text-center">
            ⚠️ 로또는 완전한 무작위 추첨이며, 본 서비스는 당첨을 보장하지 않습니다.
            책임감 있는 복권 구매를 권장합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
