'use client'; // This is the most important line!

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

export default function DynamicMap() {
  const Map = useMemo(() => dynamic(
    () => import('@/app/components/Map'), // Path to your actual map component
    {
      loading: () => <p style={{ textAlign: 'center', paddingTop: '20px' }}>Loading map...</p>,
      ssr: false // This is now allowed because we are in a Client Component
    }
  ), []);

  return <Map />;
}