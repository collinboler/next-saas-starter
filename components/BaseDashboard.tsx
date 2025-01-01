// app/components/BaseDashboard.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React from 'react';
import { ContentCoach } from './ContentCoach';
import { Script } from './Script';
import { Analysis } from './Analysis';
import { PenSquare, BarChart2, Brain } from 'lucide-react';

import { useSearchParams } from 'next/navigation';

export default function BaseDashboard() {
  const searchParams = useSearchParams();
  const view = searchParams.get('view');

  if (view === 'script-generator') {
    return <Script />;
  }

  if (view === 'account-analysis') {
    return <Analysis />;
  }

  if (view === 'content-coach') {
    return <ContentCoach />;
  }

  
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6 p-4">
      <Link href="/viralgo?view=script-generator">
        <Button variant="outline" className="w-80 h-16 flex items-center gap-3 text-lg">
          <PenSquare className="w-7 h-7" />
          Script Generator
        </Button>
      </Link>
      <Link href="/viralgo?view=content-coach">
        <Button variant="outline" className="w-80 h-16 flex items-center gap-3 text-lg">
          <Brain className="w-7 h-7" />
          Content Coach
        </Button>
      </Link>
      <Link href="/viralgo?view=account-analysis">
        <Button variant="outline" className="w-80 h-16 flex items-center gap-3 text-lg">
          <BarChart2 className="w-7 h-7" />
          Account Analysis
        </Button>
      </Link>
    </div>
  );
}
