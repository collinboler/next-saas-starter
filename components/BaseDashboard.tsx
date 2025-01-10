// app/components/BaseDashboard.tsx
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import React from 'react';
import { ContentCoach } from './ContentCoach';
import { Script } from './Script';
import { Analysis } from './Analysis';
import { PenSquare, BarChart2, Brain, Video } from 'lucide-react';
import {
  TooltipProvider,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      <TooltipProvider>
        <Tooltip delayDuration={50} defaultOpen={false}>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              className="w-80 h-16 flex items-center gap-3 text-lg opacity-50 hover:opacity-50"
              onClick={(e) => {
                e.currentTarget.focus();
              }}
            >
              <Brain className="w-7 h-7" />
              Content Coach
              <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={5} className="bg-black text-white px-3 py-2">
            <p className="text-sm font-medium">Coming Soon!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip delayDuration={50} defaultOpen={false}>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              className="w-80 h-16 flex items-center gap-3 text-lg opacity-50 hover:opacity-50"
              onClick={(e) => {
                e.currentTarget.focus();
              }}
            >
              <BarChart2 className="w-7 h-7" />
              Account Analysis
              <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={5} className="bg-black text-white px-3 py-2">
            <p className="text-sm font-medium">Coming Soon!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip delayDuration={50} defaultOpen={false}>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              className="w-80 h-16 flex items-center gap-3 text-lg opacity-50 hover:opacity-50"
              onClick={(e) => {
                e.currentTarget.focus();
              }}
            >
              <Video className="w-7 h-7" />
              Video Generator
              <span className="ml-2 text-xs text-muted-foreground">(Coming Soon)</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={5} className="bg-black text-white px-3 py-2">
            <p className="text-sm font-medium">Coming Soon!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
