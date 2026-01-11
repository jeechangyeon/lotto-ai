'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/app/contexts/AuthContext';

export default function PaymentCompletePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSubscription } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyPayment = async () => {
      // URL 파라미터에서 결제 정보 추출 (포트원 리다이렉트)
      const paymentId = searchParams.get('paymentId');
      const code = searchParams.get('code');
      const message = searchParams.get('message');

      if (code) {
        // 결제 실패
        setStatus('error');
        setMessage(message || '결제에 실패했습니다.');
        return;
      }

      if (!paymentId) {
        setStatus('error');
        setMessage('결제 정보를 찾을 수 없습니다.');
        return;
      }

      try {
        // 서버에서 결제 검증 (이미 처리되었을 수 있음)
        await refreshSubscription();
        setStatus('success');
        setMessage('결제가 완료되었습니다!');
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('결제 확인 중 오류가 발생했습니다.');
      }
    };

    verifyPayment();
  }, [searchParams, refreshSubscription]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 mx-auto mb-6">
                <div className="w-full h-full border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">결제 확인 중...</h1>
              <p className="text-gray-500">잠시만 기다려주세요.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">✅</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 완료!</h1>
              <p className="text-gray-600 mb-8">{message}</p>
              
              <div className="space-y-3">
                <Link
                  href="/mypage"
                  className="block w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                >
                  마이페이지에서 확인
                </Link>
                <Link
                  href="/ai-recommend"
                  className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  AI 추천 이용하기
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-4xl">❌</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">결제 실패</h1>
              <p className="text-gray-600 mb-8">{message}</p>
              
              <div className="space-y-3">
                <Link
                  href="/pricing"
                  className="block w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
                >
                  다시 시도하기
                </Link>
                <Link
                  href="/"
                  className="block w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition"
                >
                  홈으로 돌아가기
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
