'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth, PLAN_CONFIG } from '@/app/contexts/AuthContext';

// 로그인 없이 접근 가능한 페이지들
const publicPaths = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/pricing',
];

interface AuthWrapperProps {
  children: React.ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  // 공개 페이지는 그냥 통과
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  if (isPublicPath) {
    return <>{children}</>;
  }

  // 로딩 중
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-indigo-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-gray-600 font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인 안 됨 - 로그인 페이지로 유도
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* 로고 */}
            <div className="mb-6">
              <span className="text-6xl">🎰</span>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              LottoAI
            </h1>
            <p className="text-gray-500 mb-8">
              AI 기반 로또 분석 서비스
            </p>

            <div className="bg-indigo-50 rounded-xl p-4 mb-8">
              <p className="text-indigo-700 text-sm">
                🔒 서비스 이용을 위해 로그인이 필요합니다.
              </p>
            </div>
            
            <div className="space-y-3">
              <Link
                href="/auth/login"
                className="block w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
              >
                로그인
              </Link>
              <Link
                href="/auth/signup"
                className="block w-full bg-white text-indigo-600 py-3 px-4 rounded-xl font-bold border-2 border-indigo-200 hover:bg-indigo-50 transition"
              >
                회원가입
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <Link href="/pricing" className="text-sm text-gray-500 hover:text-indigo-600">
                요금제 보기 →
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 로그인 됨 - 콘텐츠 표시
  return <>{children}</>;
}
