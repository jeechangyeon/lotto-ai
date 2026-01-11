'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth, PLAN_CONFIG } from '@/app/contexts/AuthContext';

export default function MyPage() {
  const router = useRouter();
  const { user, profile, subscription, plan, planConfig, loading, signOut, updateProfile } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nickname: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (profile) {
      setEditData({
        nickname: profile.nickname || '',
        phone: formatPhone(profile.phone || ''),
      });
    }
  }, [profile]);

  // 전화번호 포맷팅
  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/[^0-9]/g, '');
    if (cleaned.length > 7) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
    } else if (cleaned.length > 3) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    }
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    setEditData((prev) => ({ ...prev, phone: formatPhone(value) }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    const { error } = await updateProfile({
      nickname: editData.nickname,
      phone: editData.phone.replace(/-/g, ''),
    });

    setSaving(false);

    if (error) {
      setMessage({ type: 'error', text: '저장에 실패했습니다.' });
    } else {
      setMessage({ type: 'success', text: '저장되었습니다.' });
      setIsEditing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Logout error:', e);
    }
    // 모든 스토리지 강제 삭제
    localStorage.clear();
    sessionStorage.clear();
    // 강제로 로그인 페이지로 이동
    window.location.replace('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">👤 마이페이지</h1>
          <p className="mt-2 text-gray-600">계정 정보 및 구독 관리</p>
        </div>

        {/* 프로필 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">프로필 정보</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
              >
                수정
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-500 hover:text-gray-700 font-medium text-sm"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm disabled:opacity-50"
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            )}
          </div>

          {/* 메시지 */}
          {message.text && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
              message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
            }`}>
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            {/* 이메일 (수정 불가) */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">이메일</label>
              <p className="text-gray-900">{profile.email}</p>
            </div>

            {/* 닉네임 */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">닉네임</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.nickname}
                  onChange={(e) => setEditData((prev) => ({ ...prev, nickname: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-gray-900">{profile.nickname}</p>
              )}
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">전화번호</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={handlePhoneChange}
                  placeholder="010-1234-5678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-gray-900">{formatPhone(profile.phone || '') || '-'}</p>
              )}
            </div>

            {/* 가입일 */}
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">가입일</label>
              <p className="text-gray-900">
                {new Date(user.created_at).toLocaleDateString('ko-KR')}
              </p>
            </div>
          </div>
        </div>

        {/* 구독 정보 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">💎 구독 정보</h2>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${planConfig.color}`}>
                  {planConfig.name}
                </span>
                {subscription?.status === 'active' && (
                  <span className="text-green-600 text-sm">• 활성</span>
                )}
              </div>
              <p className="text-gray-600 text-sm">
                분석 범위: {planConfig.minRound}회 ~ {planConfig.maxRound === 99999 ? '최신' : planConfig.maxRound + '회'}
              </p>
              <p className="text-gray-600 text-sm">
                AI 추천: {planConfig.aiSets > 0 ? `${planConfig.aiSets}세트` : '미제공'}
              </p>
            </div>

            {plan !== 'vip' && (
              <Link
                href="/pricing"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition text-sm"
              >
                업그레이드
              </Link>
            )}
          </div>

          {/* 플랜 비교 */}
          <div className="mt-6">
            <h3 className="font-medium text-gray-700 mb-3">내 플랜 혜택</h3>
            <div className="space-y-2 text-sm">
              {planConfig.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-600">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 계정 관리 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">⚙️ 계정 관리</h2>

          <div className="space-y-3">
            <Link
              href="/auth/change-password"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <span className="text-gray-700">비밀번호 변경</span>
              <span className="text-gray-400">→</span>
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition text-left"
            >
              <span className="text-gray-700">로그아웃</span>
              <span className="text-gray-400">→</span>
            </button>

            <button
              className="w-full flex items-center justify-between p-4 border border-red-200 rounded-lg hover:bg-red-50 transition text-left"
            >
              <span className="text-red-600">회원 탈퇴</span>
              <span className="text-red-400">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
