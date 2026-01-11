'use client';

import { AnalysisProvider } from './contexts/AnalysisContext';
import { AuthProvider } from './contexts/AuthContext';
import AuthWrapper from '@/components/AuthWrapper';
import { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthWrapper>
        <AnalysisProvider>
          {children}
        </AnalysisProvider>
      </AuthWrapper>
    </AuthProvider>
  );
}
