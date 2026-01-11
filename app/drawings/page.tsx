'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Calendar, Trophy } from 'lucide-react';

// 볼 색상 매핑
const getBallColor = (num: number): string => {
  if (num <= 10) return 'bg-yellow-400 text-yellow-900';
  if (num <= 20) return 'bg-blue-500 text-white';
  if (num <= 30) return 'bg-red-500 text-white';
  if (num <= 40) return 'bg-gray-500 text-white';
  return 'bg-green-500 text-white';
};

interface Drawing {
  round: number;
  date: string;
  numbers: number[];
  bonus: number;
  prize1st?: number;
  winners1st?: number;
}

export default function DrawingsPage() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchRound, setSearchRound] = useState('');
  const [searchResult, setSearchResult] = useState<Drawing | null>(null);
  const limit = 20;

  useEffect(() => {
    fetchDrawings();
  }, [page]);

  const fetchDrawings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drawings?page=${page}&limit=${limit}`);
      const json = await res.json();
      if (json.success) {
        setDrawings(json.data);
        setTotalPages(json.meta.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch drawings:', error);
    }
    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchRound) return;
    try {
      const res = await fetch(`/api/drawings?round=${searchRound}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSearchResult(json.data);
      } else {
        setSearchResult(null);
        alert('해당 회차를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const formatMoney = (amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('ko-KR').format(amount) + '원';
  };

  const LottoBall = ({ num, isBonus = false }: { num: number; isBonus?: boolean }) => (
    <div
      className={`
        w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm
        ${getBallColor(num)}
        ${isBonus ? 'ring-2 ring-offset-2 ring-purple-500' : ''}
        shadow-md
      `}
    >
      {num}
    </div>
  );

  const DrawingRow = ({ drawing }: { drawing: Drawing }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* 회차 정보 */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{drawing.round}</div>
            <div className="text-xs text-gray-500">회차</div>
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {drawing.date}
          </div>
        </div>

        {/* 당첨번호 */}
        <div className="flex items-center gap-2 flex-wrap">
          {drawing.numbers.map((num, i) => (
            <LottoBall key={i} num={num} />
          ))}
          <span className="text-gray-400 mx-1">+</span>
          <LottoBall num={drawing.bonus} isBonus />
        </div>

        {/* 당첨금 정보 */}
        <div className="text-right text-sm">
          <div className="flex items-center justify-end gap-1 text-amber-600">
            <Trophy className="w-4 h-4" />
            <span className="font-semibold">{formatMoney(drawing.prize1st)}</span>
          </div>
          {drawing.winners1st !== undefined && (
            <div className="text-gray-500 text-xs">
              1등 {drawing.winners1st}명
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">당첨번호 조회</h1>
          <p className="text-gray-600">역대 로또 당첨번호를 확인하세요</p>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="회차 번호 입력"
              value={searchRound}
              onChange={(e) => setSearchRound(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              검색
            </button>
          </div>

          {/* 검색 결과 */}
          {searchResult && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-2">검색 결과</div>
              <DrawingRow drawing={searchResult} />
              <button
                onClick={() => setSearchResult(null)}
                className="mt-2 text-sm text-gray-500 hover:text-gray-700"
              >
                닫기
              </button>
            </div>
          )}
        </div>

        {/* 목록 */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
          ) : drawings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              데이터가 없습니다
            </div>
          ) : (
            drawings.map((drawing) => (
              <DrawingRow key={drawing.round} drawing={drawing} />
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-gray-600">
              <span className="font-semibold text-blue-600">{page}</span>
              <span className="mx-1">/</span>
              <span>{totalPages}</span>
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* 안내 문구 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>데이터 출처: 동행복권 (www.dhlottery.co.kr)</p>
        </div>
      </div>
    </div>
  );
}
