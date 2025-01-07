'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Trash2 } from 'lucide-react';
import { useFormState } from 'react-dom';
import { updatePassword, deleteAccount } from '@/app/(login)/actions';

type ActionState = {
  error?: string;
  success?: string;
};

export default function SecurityPage() {
  const [passwordState, passwordAction] = useFormState<ActionState, FormData>(
    updatePassword,
    { error: '', success: '' }
  );

  const [deleteState, deleteAction] = useFormState<ActionState, FormData>(
    deleteAccount,
    { error: '', success: '' }
  );

  return (
    <div className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">Security Settings</h1>
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={passwordAction} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type="password"
                  required
                />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  required
                  minLength={8}
                />
              </div>
              {passwordState?.error && (
                <p className="text-red-500">{passwordState.error}</p>
              )}
              {passwordState?.success && (
                <p className="text-green-500">{passwordState.success}</p>
              )}
              <Button type="submit" className="w-full">
                <Lock className="mr-2 h-4 w-4" />
                Update Password
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delete Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={deleteAction} className="space-y-4">
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                />
              </div>
              {deleteState?.error && (
                <p className="text-red-500">{deleteState.error}</p>
              )}
              <Button type="submit" variant="destructive" className="w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
