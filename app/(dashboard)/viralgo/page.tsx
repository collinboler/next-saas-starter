import { redirect } from 'next/navigation';
import { getTeamForUser, getUser } from '@/lib/db/queries';

export default async function ViralGoPage() {
  const user = await getUser();

  if (!user) {
    redirect('/sign-in');
  }

  const teamData = await getTeamForUser(user.id);

  if (!teamData) {
    throw new Error('Team not found');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">ViralGo Dashboard</h1>
      <p className="mb-4">
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
        incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis 
        nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
      </p>
      <p>
        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
        eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt 
        in culpa qui officia deserunt mollit anim id est laborum.
      </p>
    </div>
  );
}
