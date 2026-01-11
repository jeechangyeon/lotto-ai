'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, PLAN_CONFIG } from '@/app/contexts/AuthContext';

// 가격 정보
const PRICES = {
  premium: { monthly: 3900, yearly: 39000 },
  vip: { monthly: 9900, yearly: 99000 },
};

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, plan, refreshSubscription } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const selectedPlan = searchParams.get('plan') as 'premium' | 'vip' || 'premium';
  const period = searchParams.get('period') as 'monthly' | 'yearly' || 'monthly';
  
  const price = PRICES[selectedPlan]?.[period] || 0;
  const planConfig = PLAN_CONFIG[selectedPlan];

  useEffect(() => {
    // 포트원 SDK 로드
    const script = document.createElement('script');
    script.src = 'https://cdn.portone.io/v2/browser-sdk.js';
    script.async = true;
    document.head.appendChild(script);
    
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!user || !profile) {
      alert('로그인이 필요합니다.');
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // @ts-ignore - 포트원 SDK
      const PortOne = window.PortOne;
      
      if (!PortOne) {
        throw new Error('결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      }

      const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
      const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;

      if (!storeId || !channelKey) {
        throw new Error('결제 설정이 완료되지 않았습니다.');
      }

      // 주문 ID 생성
      const orderId = `ORDER_${Date.now()}_${user.id.slice(0, 8)}`;
      
      // 결제 요청
      const response = await PortOne.requestPayment({
        storeId: storeId,
        channelKey: channelKey,
        paymentId: orderId,
        orderName: `LottoAI ${planConfig.name} (${period === 'monthly' ? '월간' : '연간'})`,
        totalAmount: price,
        currency: 'KRW',
        payMethod: 'CARD',
        customer: {
          customerId: user.id,
          email: profile.email,
          phoneNumber: profile.phone || undefined,
          fullName: profile.nickname,
        },
        redirectUrl: `${window.location.origin}/payment/complete`,
      });

      if (response.code) {
        // 결제 실패
        throw new Error(response.message || '결제에 실패했습니다.');
      }

      // 결제 성공 - 서버에서 검증
      const verifyResponse = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: response.paymentId,
          orderId: orderId,
          plan: selectedPlan,
          period: period,
          amount: price,
        }),
      });

      const verifyResult = await verifyResponse.json();

      if (verifyResult.success) {
        // 구독 정보 새로고침
        await refreshSubscription();
        alert('결제가 완료되었습니다!');
        router.push('/mypage');
      } else {
        throw new Error(verifyResult.message || '결제 검증에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || '결제 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>로그인이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">💳 결제하기</h1>
            <p className="text-gray-500">안전한 결제를 진행합니다</p>
          </div>

          {/* 상품 정보 */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${planConfig?.color || 'bg-gray-200'}`}>
                  {planConfig?.name}
                </span>
                <span className="ml-2 text-gray-500 text-sm">
                  {period === 'monthly' ? '월간' : '연간'} 구독
                </span>
              </div>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 mb-4">
              {planConfig?.features.slice(0, 5).map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">결제 금액</span>
                <span className="text-2xl font-bold text-gray-900">
                  ₩{formatPrice(price)}
                </span>
              </div>
              {period === 'yearly' && (
                <p className="text-sm text-green-600 text-right mt-1">
                  월 ₩{formatPrice(Math.round(price / 12))} (17% 할인)
                </p>
              )}
            </div>
          </div>

          {/* 구매자 정보 */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-700 mb-3">구매자 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">이메일</span>
                <span className="text-gray-900">{profile?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">닉네임</span>
                <span className="text-gray-900">{profile?.nickname}</span>
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* 결제 버튼 */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                결제 처리 중...
              </span>
            ) : (
              `₩${formatPrice(price)} 결제하기`
            )}
          </button>

          {/* 안내 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              결제 시 <a href="/terms" className="underline">이용약관</a> 및{' '}
              <a href="/privacy" className="underline">개인정보처리방침</a>에 동의합니다.
            </p>
          </div>

          {/* 뒤로가기 */}
          <button
            onClick={() => router.back()}
            className="w-full mt-4 py-3 text-gray-500 hover:text-gray-700 transition text-sm"
          >
            ← 돌아가기
          </button>
        </div>

        {/* 결제 안내 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <h4 className="font-medium text-blue-800 mb-2">💡 결제 안내</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 결제 완료 즉시 서비스가 활성화됩니다.</li>
            <li>• 구독은 자동 갱신되지 않습니다.</li>
            <li>• 환불은 결제 후 7일 이내 가능합니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
