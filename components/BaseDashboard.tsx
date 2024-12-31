// app/components/BaseDashboard.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React from 'react';
import { ContentCoach } from './ContentCoach';
import { useSearchParams } from 'next/navigation';

export default function BaseDashboard() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  if (view === 'content-coach') {
    return <ContentCoach />;
  }

  return (
    <div className="flex gap-4 p-4">
      <Link href="/script-generator">
        <Button variant="outline">Script Generator</Button>
      </Link>
      <Link href="/tiktok">
        <Button variant="outline">TikTok Analytics</Button>
      </Link>
      <Link href="/viralgo?view=content-coach">
        <Button variant="outline">Content Coach</Button>
      </Link>
    </div>
  );
}
