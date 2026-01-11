// ============================================
// Footer 컴포넌트
// ============================================

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 서비스 소개 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">🎰</span>
              <span className="font-bold text-xl text-white">LottoAI</span>
            </div>
            <p className="text-sm text-gray-400">
              AI 기반 로또 분석 서비스입니다. 
              30가지 통계 분석과 머신러닝을 통해 
              당첨 확률을 높이는 번호를 추천합니다.
            </p>
          </div>

          {/* 주의사항 */}
          <div>
            <h4 className="font-semibold text-white mb-4">⚠️ 주의사항</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• 로또는 완전한 무작위 추첨입니다</li>
              <li>• 어떤 분석도 당첨을 보장하지 않습니다</li>
              <li>• 월 수입의 1% 이내로만 구매하세요</li>
              <li>• 재미로 즐기시길 권장합니다</li>
            </ul>
          </div>

          {/* 링크 */}
          <div>
            <h4 className="font-semibold text-white mb-4">바로가기</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a 
                  href="https://www.dhlottery.co.kr" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  동행복권 공식 사이트 →
                </a>
              </li>
              <li>
                <a 
                  href="/about"
                  className="hover:text-white transition-colors"
                >
                  서비스 소개 →
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>© 2024 LottoAI. 본 서비스는 참고용이며 당첨을 보장하지 않습니다.</p>
        </div>
      </div>
    </footer>
  );
}
