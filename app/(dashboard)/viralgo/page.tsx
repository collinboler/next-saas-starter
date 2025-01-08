import { redirect } from 'next/navigation';
import { getTeamForUser } from '@/lib/db/queries';
import React from 'react';
import BaseDashboard from '@/components/BaseDashboard';
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

export default async function ViralGoPage() {
  return (
    <ClerkProvider>
      <SignedIn>
        <div className="container mx-auto px-4 py-8">
          <BaseDashboard />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </ClerkProvider>
  );
}