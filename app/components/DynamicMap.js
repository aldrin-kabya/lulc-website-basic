'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

export default function DynamicMap() {
  const Map = useMemo(() => dynamic(
    () => import('@/app/components/Map'),
    {
      loading: () => <p style={{ textAlign: 'center', paddingTop: '20px' }}>Loading map...</p>,
      ssr: false
    }
  ), []);

  return <Map />;
}