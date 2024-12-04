import { redirect } from 'next/navigation';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { Login } from 'app/(login)/login';
import React from 'react';
import { ChatBot } from '@/components/chatbot';
import { ChatLayout } from '@/components/chatlayout';
import BaseDashboard from '@/components/BaseDashboard';

export default async function ViralGoPage() {
  const user = await getUser();

  if (!user) {
    return <Login mode="signin" />;
  }

  const team = await getTeamForUser(user.id);

  if (!team) {
    throw new Error('Team not found');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BaseDashboard />

      {!["Base", "Plus"].includes(team.planName || '') && (
        <>
         
        </>
      )}
    </div>
  );
}