import { redirect } from 'next/navigation';
import { getTeamForUser, getUser } from '@/lib/db/queries';
import { Login } from 'app/(login)/login';
import React from 'react';
import { ChatBot } from '@/components/chatbot';
import { ChatLayout } from '@/components/chatlayout';
import BaseDashboard from '@/components/BaseDashboard'; // Import BaseDashboard


export default async function ViralGoPage() {
  const user = await getUser();

  if (!user) {
    return <Login mode="signin" />;
  }

  const team = await getTeamForUser(user.id);

  if (!team) {
    throw new Error('Team not found');
  }

  // Redirect to pricing if no plan is selected
  if (!team.planName) {
    redirect('/pricing');
  }

  // Common layout wrapper for all plan types
  return (
    <div className="container mx-auto px-4 py-8">
      {team.planName === "Base" && (
        <>
          <h1 className="text-3xl font-bold mb-6">ViralGo Base Dashboard</h1>
            
          <BaseDashboard />
          <p>Welcome to your Base plan dashboard</p>

          
        </>
      )}

      {team.planName === "Plus" && (
        <>
          <h1 className="text-3xl font-bold mb-6">ViralGo Plus Dashboard</h1>
          {/* Add Plus plan specific features here */}
          <p>Welcome to your Plus plan dashboard with advanced features</p>
        </>
      )}

      {!["Base", "Plus"].includes(team.planName) && (
        <>
          <h1 className="text-3xl font-bold mb-6">ViralGo Preview</h1>
          <p className="mb-4">
            Try ViralGo free preview to explore our features
          </p>
          {/* Add upgrade CTA here */}
        </>
      )}
    </div>
  );
}