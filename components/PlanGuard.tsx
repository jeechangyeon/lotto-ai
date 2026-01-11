'use client';

import Link from 'next/link';
import { useAuth, PLAN_CONFIG } from '@/app/contexts/AuthContext';

interface PlanGuardProps {
  children: React.ReactNode;
  requiredPlan: 'premium' | 'vip';
}

// 등급 제한 가드 (로그인은 AuthWrapper에서 처리)
export default function PlanGuard({ children, requiredPlan }: PlanGuardProps) {
  const { plan, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 등급 확인
  const planLevels = { free: 0, premium: 1, vip: 2 };
  const userLevel = planLevels[plan];
  const requiredLevel = planLevels[requiredPlan];

  if (userLevel < requiredLevel) {
    const requiredConfig = PLAN_CONFIG[requiredPlan];
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-6xl mb-6">⭐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {requiredConfig.name} 등급 이상 필요
            </h2>
            <p className="text-gray-600 mb-4">
              이 기능은 <span className={`px-2 py-1 rounded ${requiredConfig.color} font-medium`}>
                {requiredConfig.name}
              </span> 등급 이상만 이용할 수 있습니다.
            </p>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">{requiredConfig.name} 등급 혜택:</p>
              <ul className="text-sm text-gray-600 space-y-1">
                {requiredConfig.features.map((f, i) => (
                  <li key={i}>✓ {f}</li>
                ))}
              </ul>
            </div>
            
            <Link
              href="/pricing"
              className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition"
            >
              등급 업그레이드
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
