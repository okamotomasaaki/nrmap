'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lang = window.navigator.language || 'ja';
      const cleanLang = lang.toLowerCase();
      if (cleanLang.startsWith('zh')) {
        router.replace('/zh');
      } else if (cleanLang.startsWith('en')) {
        router.replace('/en');
      } else {
        router.replace('/ja');
      }
    }
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-gray-950 text-gray-400">
      <div className="text-lg animate-pulse">Loading...</div>
    </div>
  );
}
