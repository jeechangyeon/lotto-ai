-- ============================================
-- 로또 AI 분석 서비스 - Supabase 스키마
-- ============================================

-- 1. 당첨번호 테이블
CREATE TABLE IF NOT EXISTS drawings (
  id BIGSERIAL PRIMARY KEY,
  round_no INTEGER UNIQUE NOT NULL,
  draw_date DATE NOT NULL,
  num1 SMALLINT NOT NULL CHECK (num1 BETWEEN 1 AND 45),
  num2 SMALLINT NOT NULL CHECK (num2 BETWEEN 1 AND 45),
  num3 SMALLINT NOT NULL CHECK (num3 BETWEEN 1 AND 45),
  num4 SMALLINT NOT NULL CHECK (num4 BETWEEN 1 AND 45),
  num5 SMALLINT NOT NULL CHECK (num5 BETWEEN 1 AND 45),
  num6 SMALLINT NOT NULL CHECK (num6 BETWEEN 1 AND 45),
  bonus SMALLINT NOT NULL CHECK (bonus BETWEEN 1 AND 45),
  total_sum SMALLINT GENERATED ALWAYS AS (num1 + num2 + num3 + num4 + num5 + num6) STORED,
  odd_count SMALLINT GENERATED ALWAYS AS (
    (num1 % 2) + (num2 % 2) + (num3 % 2) + (num4 % 2) + (num5 % 2) + (num6 % 2)
  ) STORED,
  prize_1st BIGINT DEFAULT 0,
  winners_1st INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_drawings_round_no ON drawings(round_no DESC);
CREATE INDEX IF NOT EXISTS idx_drawings_draw_date ON drawings(draw_date DESC);

-- 2. 분석 캐시 테이블
CREATE TABLE IF NOT EXISTS analysis_cache (
  id BIGSERIAL PRIMARY KEY,
  analysis_type VARCHAR(50) NOT NULL,
  latest_round INTEGER NOT NULL,
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analysis_cache_type ON analysis_cache(analysis_type);

-- 3. AI 추천 결과 테이블
CREATE TABLE IF NOT EXISTS ai_recommendations (
  id BIGSERIAL PRIMARY KEY,
  target_round INTEGER UNIQUE NOT NULL,
  top20_numbers INTEGER[] NOT NULL,
  set1 INTEGER[] NOT NULL,
  set2 INTEGER[] NOT NULL,
  set3 INTEGER[] NOT NULL,
  set4 INTEGER[] NOT NULL,
  set5 INTEGER[] NOT NULL,
  scores_json JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_recommendations_round ON ai_recommendations(target_round DESC);

-- 4. RLS (Row Level Security) 설정
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책
CREATE POLICY "drawings_public_read" ON drawings FOR SELECT USING (true);
CREATE POLICY "analysis_cache_public_read" ON analysis_cache FOR SELECT USING (true);
CREATE POLICY "ai_recommendations_public_read" ON ai_recommendations FOR SELECT USING (true);

-- 서비스 롤 쓰기 정책 (service_role 키 사용시)
CREATE POLICY "drawings_service_insert" ON drawings FOR INSERT WITH CHECK (true);
CREATE POLICY "analysis_cache_service_all" ON analysis_cache FOR ALL USING (true);
CREATE POLICY "ai_recommendations_service_all" ON ai_recommendations FOR ALL USING (true);

-- 5. 뷰: 최근 당첨번호
CREATE OR REPLACE VIEW recent_drawings AS
SELECT 
  round_no,
  draw_date,
  num1, num2, num3, num4, num5, num6,
  bonus,
  total_sum,
  odd_count,
  prize_1st,
  winners_1st
FROM drawings
ORDER BY round_no DESC
LIMIT 10;

-- 6. 함수: 번호 빈도 계산
CREATE OR REPLACE FUNCTION get_number_frequency()
RETURNS TABLE (number INTEGER, frequency BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT n.number, COUNT(*) as frequency
  FROM drawings d
  CROSS JOIN LATERAL (
    VALUES (d.num1), (d.num2), (d.num3), (d.num4), (d.num5), (d.num6)
  ) AS n(number)
  GROUP BY n.number
  ORDER BY n.number;
END;
$$ LANGUAGE plpgsql;

-- 7. 함수: 최근 N회차 빈도
CREATE OR REPLACE FUNCTION get_recent_frequency(n_rounds INTEGER DEFAULT 20)
RETURNS TABLE (number INTEGER, frequency BIGINT) AS $$
BEGIN
  RETURN QUERY
  WITH recent AS (
    SELECT num1, num2, num3, num4, num5, num6
    FROM drawings
    ORDER BY round_no DESC
    LIMIT n_rounds
  )
  SELECT n.number, COUNT(*) as frequency
  FROM recent d
  CROSS JOIN LATERAL (
    VALUES (d.num1), (d.num2), (d.num3), (d.num4), (d.num5), (d.num6)
  ) AS n(number)
  GROUP BY n.number
  ORDER BY frequency DESC, n.number;
END;
$$ LANGUAGE plpgsql;

-- 완료 메시지
COMMENT ON TABLE drawings IS '로또 당첨번호 데이터 (1~1205회차)';
COMMENT ON TABLE analysis_cache IS '통계 분석 결과 캐시';
COMMENT ON TABLE ai_recommendations IS 'AI 추천 번호 결과';
