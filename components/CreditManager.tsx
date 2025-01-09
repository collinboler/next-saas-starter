'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function CreditManager() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [lastReset, setLastReset] = useState<string | null>(null);
  const [action, setAction] = useState<string>('create');
  const [message, setMessage] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(false);

  // Function to initialize credits
  const initializeUserCredits = async () => {
    if (!user) return;
    
    try {
      setIsInitializing(true);
      console.log('Initializing credits for new user...');
      
      // First, get the current metadata
      const currentMetadata = user.unsafeMetadata;
      console.log('Current metadata:', currentMetadata);

      // Set initial credits
      await user.update({
        unsafeMetadata: {
          ...currentMetadata, // Preserve any existing metadata
          credits: 10,
          lastCreditReset: new Date().toISOString()
        }
      });

      console.log('Credits initialized successfully');
      setCredits(10);
      setLastReset(new Date().toISOString());
      setMessage('Welcome! You have been given 10 credits to start.');
    } catch (error) {
      console.error('Failed to initialize credits:', error);
      setMessage('Failed to initialize credits. Please refresh the page.');
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    const checkAndInitializeCredits = async () => {
      if (!isLoaded || !isSignedIn || !user || isInitializing) return;

      console.log('Checking user credits...');
      console.log('Current unsafe metadata:', user.unsafeMetadata);
      
      const userCredits = user.unsafeMetadata?.credits;
      console.log('User credits:', userCredits);

      if (userCredits === undefined || userCredits === null) {
        await initializeUserCredits();
      } else {
        setCredits(userCredits as number);
        setLastReset(user.unsafeMetadata?.lastCreditReset as string || null);
      }
    };

    checkAndInitializeCredits();
  }, [isLoaded, isSignedIn, user, isInitializing]);

  const resetCredits = async () => {
    if (!user) return;

    const now = new Date();
    const estNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const lastResetDate = lastReset ? new Date(lastReset) : new Date(0);
    const estLastReset = new Date(lastResetDate.toLocaleString('en-US', { timeZone: 'America/New_York' }));

    // Reset credits if it's a new day
    if (estNow.toDateString() !== estLastReset.toDateString()) {
      try {
        const currentMetadata = user.unsafeMetadata;
        await user.update({
          unsafeMetadata: {
            ...currentMetadata,
            credits: 10,
            lastCreditReset: estNow.toISOString()
          },
        });
        setCredits(10);
        setLastReset(estNow.toISOString());
        setMessage('Credits have been reset to 10.');
      } catch (error) {
        console.error('Failed to reset credits:', error);
        setMessage('Failed to reset credits. Please try again.');
      }
    } else {
      setMessage('Credits have already been reset today.');
    }
  };

  const decrementCredits = async () => {
    if (!user || credits === null) return;

    const creditCost = action === 'create' ? 2 : action === 'remix' ? 1 : 1;

    if (credits >= creditCost) {
      try {
        const currentMetadata = user.unsafeMetadata;
        await user.update({
          unsafeMetadata: {
            ...currentMetadata,
            credits: credits - creditCost,
            lastCreditReset: lastReset
          },
        });
        setCredits(credits - creditCost);
        setMessage(`Action '${action}' performed. ${creditCost} credits deducted.`);
      } catch (error) {
        console.error('Failed to update credits:', error);
        setMessage('Failed to update credits. Please try again.');
      }
    } else {
      setMessage(`Insufficient credits. You need ${creditCost} credits for this action.`);
    }
  };

  if (!isLoaded) {
    return <div className="p-4">Loading...</div>;
  }

  if (!isSignedIn) {
    return <div className="p-4">Please sign in to manage your credits.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Manager</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-lg font-medium">
            Credits: {isInitializing ? 'Initializing...' : (credits !== null ? credits : 'Loading...')}
          </p>
          <p className="text-sm text-muted-foreground">
            Last Reset: {lastReset ? new Date(lastReset).toLocaleString() : 'Never'}
          </p>
        </div>

        <Button onClick={resetCredits} variant="outline" disabled={isInitializing}>
          Reset Credits
        </Button>

        <div className="space-y-2">
          <Label>Action</Label>
          <Select value={action} onValueChange={setAction} disabled={isInitializing}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="create">Create (2 credits)</SelectItem>
              <SelectItem value="remix">Remix (1 credit)</SelectItem>
              <SelectItem value="other">Other (1 credit)</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={decrementCredits} disabled={isInitializing}>
            Perform Action
          </Button>
        </div>

        {message && (
          <p className="text-sm text-muted-foreground">{message}</p>
        )}
      </CardContent>
    </Card>
  );
} 