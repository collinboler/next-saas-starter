import { redirect } from 'next/navigation';
import { getTeamForUser, getUser } from '@/lib/db/queries';

export default async function ViralGoPage() {
  const user = await getUser();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to ViralGo</h1>
        <p className="mb-4">Please sign in to access ViralGo features</p>
        {/* Add sign in button/link here */}
      </div>
    );
  }

  const teamData = await getTeamForUser(user.id);

  if (!teamData) {
    throw new Error('Team not found');
  }

  if (teamData.planName === "Base") {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">ViralGo Base Dashboard</h1>
        {/* Add Base plan specific features here */}
        <p>Welcome to your Base plan dashboard</p>
      </div>
    );
  }

  if (teamData.planName === "Plus") {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">ViralGo Plus Dashboard</h1>
        {/* Add Plus plan specific features here */}
        <p>Welcome to your Plus plan dashboard with advanced features</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ViralGo Preview</h1>
      <p className="mb-4">
        Try ViralGo free preview to explore our features
      </p>
      {/* Add upgrade CTA here */}
    </div>
  );
}
