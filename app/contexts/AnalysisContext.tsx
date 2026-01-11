'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth, PLAN_CONFIG } from './AuthContext';

interface DrawingData {
  round: number;
  numbers: number[];
  bonus: number;
}

interface AnalysisContextType {
  // 전체 데이터
  allDrawings: DrawingData[];
  loading: boolean;
  
  // 회차 범위
  startRound: number;
  endRound: number;
  minRoundInDB: number;
  maxRoundInDB: number;
  
  // 등급별 허용 범위
  allowedMinRound: number;
  allowedMaxRound: number;
  
  // 필터링된 데이터
  filteredDrawings: DrawingData[];
  
  // 함수들
  setStartRound: (round: number) => void;
  setEndRound: (round: number) => void;
  refreshData: () => Promise<void>;
}

const AnalysisContext = createContext<AnalysisContextType | undefined>(undefined);

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const { plan, user } = useAuth();
  
  const [allDrawings, setAllDrawings] = useState<DrawingData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [startRound, setStartRoundState] = useState<number>(1);
  const [endRound, setEndRoundState] = useState<number>(1);
  const [minRoundInDB, setMinRoundInDB] = useState<number>(1);
  const [maxRoundInDB, setMaxRoundInDB] = useState<number>(1);

  // 등급별 허용 범위 계산
  const planConfig = PLAN_CONFIG[plan];
  const allowedMinRound = planConfig.minRound;
  const allowedMaxRound = Math.min(planConfig.maxRound, maxRoundInDB);

  // 데이터 로드
  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/drawings?all=true');
      const json = await res.json();

      if (json.success && json.data.length > 0) {
        const drawings: DrawingData[] = json.data;
        setAllDrawings(drawings);
        
        const rounds = drawings.map(d => d.round);
        const minRound = Math.min(...rounds);
        const maxRound = Math.max(...rounds);
        
        setMinRoundInDB(minRound);
        setMaxRoundInDB(maxRound);
        
        // 등급별 기본 범위 설정
        const config = PLAN_CONFIG[plan];
        const defaultMin = Math.max(config.minRound, minRound);
        const defaultMax = Math.min(config.maxRound, maxRound);
        
        // localStorage에서 저장된 범위 불러오기
        const savedStart = localStorage.getItem('lotto_start_round');
        const savedEnd = localStorage.getItem('lotto_end_round');
        
        if (savedStart && savedEnd) {
          const parsedStart = parseInt(savedStart);
          const parsedEnd = parseInt(savedEnd);
          // 유효한 범위인지 확인 (등급 허용 범위 내)
          if (parsedStart >= defaultMin && parsedEnd <= defaultMax && parsedStart <= parsedEnd) {
            setStartRoundState(parsedStart);
            setEndRoundState(parsedEnd);
          } else {
            setStartRoundState(defaultMin);
            setEndRoundState(defaultMax);
          }
        } else {
          setStartRoundState(defaultMin);
          setEndRoundState(defaultMax);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [plan]); // plan 변경 시 다시 로드

  // 시작 회차 설정 (등급 범위 내에서만)
  const setStartRound = (round: number) => {
    const validRound = Math.max(allowedMinRound, Math.min(endRound, round));
    setStartRoundState(validRound);
    localStorage.setItem('lotto_start_round', String(validRound));
  };

  // 끝 회차 설정 (등급 범위 내에서만)
  const setEndRound = (round: number) => {
    const validRound = Math.max(startRound, Math.min(allowedMaxRound, round));
    setEndRoundState(validRound);
    localStorage.setItem('lotto_end_round', String(validRound));
  };

  // 필터링된 데이터 (등급 범위 내)
  const filteredDrawings = allDrawings.filter(
    d => d.round >= startRound && d.round <= endRound && 
         d.round >= allowedMinRound && d.round <= allowedMaxRound
  );

  const refreshData = async () => {
    await loadData();
  };

  return (
    <AnalysisContext.Provider
      value={{
        allDrawings,
        loading,
        startRound,
        endRound,
        minRoundInDB,
        maxRoundInDB,
        allowedMinRound,
        allowedMaxRound,
        filteredDrawings,
        setStartRound,
        setEndRound,
        refreshData,
      }}
    >
      {children}
    </AnalysisContext.Provider>
  );
}

export function useAnalysis() {
  const context = useContext(AnalysisContext);
  if (context === undefined) {
    throw new Error('useAnalysis must be used within an AnalysisProvider');
  }
  return context;
}
