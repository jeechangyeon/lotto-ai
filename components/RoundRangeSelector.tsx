'use client';

import { useAnalysis } from '@/app/contexts/AnalysisContext';

interface RoundRangeSelectorProps {
  compact?: boolean;
}

export default function RoundRangeSelector({ compact = false }: RoundRangeSelectorProps) {
  const {
    loading,
    startRound,
    endRound,
    minRoundInDB,
    maxRoundInDB,
    setStartRound,
    setEndRound,
    filteredDrawings,
  } = useAnalysis();

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-10 bg-gray-200 rounded"></div>
      </div>
    );
  }

  const analyzedCount = filteredDrawings.length;

  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700">📊 분석 범위:</span>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setStartRound(startRound - 10)}
              disabled={startRound <= minRoundInDB + 9}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold text-gray-600 disabled:opacity-40"
            >
              -10
            </button>
            <button
              onClick={() => setStartRound(startRound - 1)}
              disabled={startRound <= minRoundInDB}
              className="w-6 h-8 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold text-gray-600 disabled:opacity-40"
            >
              -
            </button>
            <input
              type="number"
              value={startRound}
              onChange={(e) => setStartRound(parseInt(e.target.value) || minRoundInDB)}
              className="w-20 px-2 py-1 border rounded text-center text-sm font-medium"
            />
            <button
              onClick={() => setStartRound(startRound + 1)}
              disabled={startRound >= endRound}
              className="w-6 h-8 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold text-gray-600 disabled:opacity-40"
            >
              +
            </button>
            <button
              onClick={() => setStartRound(startRound + 10)}
              disabled={startRound >= endRound - 9}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold text-gray-600 disabled:opacity-40"
            >
              +10
            </button>
          </div>

          <span className="text-gray-400 font-bold">~</span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setEndRound(endRound - 10)}
              disabled={endRound <= startRound + 9}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold text-gray-600 disabled:opacity-40"
            >
              -10
            </button>
            <button
              onClick={() => setEndRound(endRound - 1)}
              disabled={endRound <= startRound}
              className="w-6 h-8 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold text-gray-600 disabled:opacity-40"
            >
              -
            </button>
            <input
              type="number"
              value={endRound}
              onChange={(e) => setEndRound(parseInt(e.target.value) || maxRoundInDB)}
              className="w-20 px-2 py-1 border rounded text-center text-sm font-medium"
            />
            <button
              onClick={() => setEndRound(endRound + 1)}
              disabled={endRound >= maxRoundInDB}
              className="w-6 h-8 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold text-gray-600 disabled:opacity-40"
            >
              +
            </button>
            <button
              onClick={() => setEndRound(endRound + 10)}
              disabled={endRound >= maxRoundInDB - 9}
              className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded text-sm font-bold text-gray-600 disabled:opacity-40"
            >
              +10
            </button>
          </div>

          <span className="text-sm text-indigo-600 font-medium">
            ({analyzedCount.toLocaleString()}회 분석)
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span>⚙️</span>
        분석 회차 범위 설정
        <span className="text-xs font-normal text-gray-500 ml-2">(모든 페이지에 적용)</span>
      </h3>
      
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">시작:</label>
          <button
            onClick={() => setStartRound(startRound - 10)}
            disabled={startRound <= minRoundInDB + 9}
            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            -10
          </button>
          <button
            onClick={() => setStartRound(startRound - 1)}
            disabled={startRound <= minRoundInDB}
            className="w-8 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            -
          </button>
          <input
            type="number"
            min={minRoundInDB}
            max={endRound}
            value={startRound}
            onChange={(e) => setStartRound(parseInt(e.target.value) || minRoundInDB)}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-medium focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => setStartRound(startRound + 1)}
            disabled={startRound >= endRound}
            className="w-8 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
          <button
            onClick={() => setStartRound(startRound + 10)}
            disabled={startRound >= endRound - 9}
            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +10
          </button>
          <span className="text-gray-600">회</span>
        </div>
        
        <span className="text-2xl text-gray-400 font-bold">~</span>
        
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">끝:</label>
          <button
            onClick={() => setEndRound(endRound - 10)}
            disabled={endRound <= startRound + 9}
            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            -10
          </button>
          <button
            onClick={() => setEndRound(endRound - 1)}
            disabled={endRound <= startRound}
            className="w-8 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            -
          </button>
          <input
            type="number"
            min={startRound}
            max={maxRoundInDB}
            value={endRound}
            onChange={(e) => setEndRound(parseInt(e.target.value) || maxRoundInDB)}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-medium focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => setEndRound(endRound + 1)}
            disabled={endRound >= maxRoundInDB}
            className="w-8 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
          <button
            onClick={() => setEndRound(endRound + 10)}
            disabled={endRound >= maxRoundInDB - 9}
            className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-lg font-bold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +10
          </button>
          <span className="text-gray-600">회</span>
        </div>
      </div>
      
      <div className="p-3 bg-indigo-50 rounded-lg">
        <p className="text-indigo-800 font-medium">
          📊 분석 범위: <strong>{startRound}회 ~ {endRound}회</strong> (총 <strong>{analyzedCount.toLocaleString()}회</strong> 분석)
        </p>
        <p className="text-sm text-indigo-600 mt-1">
          DB 보유 데이터: {minRoundInDB}회 ~ {maxRoundInDB}회
        </p>
      </div>
      
      <p className="text-xs text-gray-500 mt-3">
        💡 여기서 설정한 범위는 통계 분석, AI 추천 등 모든 페이지에 동일하게 적용됩니다.
      </p>
    </div>
  );
}
