// ============================================
// Next.js 메인 레이아웃
// ============================================

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'LottoAI - AI 기반 로또 분석 서비스',
  description: '30가지 통계 분석과 AI를 활용한 로또 번호 추천 서비스',
  keywords: ['로또', '로또분석', 'AI추천', '당첨번호', '통계분석'],
  openGraph: {
    title: 'LottoAI - AI 기반 로또 분석 서비스',
    description: '30가지 통계 분석과 AI를 활용한 로또 번호 추천',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className={`${inter.className} min-h-screen flex flex-col bg-gray-50`}>
        <Providers>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
