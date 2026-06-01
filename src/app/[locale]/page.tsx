import MapSearch from '@/components/MapSearch';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocalePage({ params }: PageProps) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || 'ja';
  
  return <MapSearch locale={locale} />;
}

// 静的HTMLビルド用の設定
export function generateStaticParams() {
  return [
    { locale: 'ja' },
    { locale: 'en' },
    { locale: 'zh' }
  ];
}
