'use client';

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CreditDisplayProps {
  showAsDialog?: boolean;
  trigger?: React.ReactNode;
}

export function CreditDisplay({ showAsDialog = false, trigger }: CreditDisplayProps) {
  const { user } = useUser();
  const [credits, setCredits] = useState<number>(0);
  const [lastReset, setLastReset] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingCredits, setIsAddingCredits] = useState(false);

  useEffect(() => {
    const checkAndUpdateCredits = async () => {
      if (!user) return;

      try {
        // First try to get credits, this will return 0 if not initialized
        const getResponse = await fetch('/api/credits');
        const getData = await getResponse.json();
        
        // If credits are 0 and no lastReset, we need to initialize
        if (getData.credits === 0 && !getData.lastReset) {
          console.log('Initializing credits for new user...');
          const initResponse = await fetch('/api/credits', { method: 'POST' });
          const initData = await initResponse.json();
          
          if (initResponse.ok) {
            setCredits(initData.credits);
            setLastReset(initData.lastReset);
          }
        } else {
          // Check if we need to reset for a new day
          const now = new Date();
          const est = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
          const lastResetDate = getData.lastReset ? new Date(getData.lastReset) : new Date(0);
          const estLastReset = new Date(lastResetDate.toLocaleString("en-US", { timeZone: "America/New_York" }));

          if (est.toDateString() !== estLastReset.toDateString()) {
            console.log('Resetting credits for new day...');
            const resetResponse = await fetch('/api/credits', { method: 'POST' });
            const resetData = await resetResponse.json();
            
            if (resetResponse.ok) {
              setCredits(resetData.credits);
              setLastReset(resetData.lastReset);
            }
          } else {
            setCredits(getData.credits);
            setLastReset(getData.lastReset);
          }
        }
      } catch (error) {
        console.error('Failed to manage credits:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAndUpdateCredits();
    // Poll for updates every minute
    const interval = setInterval(checkAndUpdateCredits, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const addTestCredits = async () => {
    try {
      setIsAddingCredits(true);
      console.log('Adding test credits...');
      
      const response = await fetch('/api/credits', { 
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('Add credits response:', data);
      
      if (response.ok) {
        setCredits(data.credits);
        console.log('Credits updated:', data.credits);
      } else {
        console.error('Failed to add credits:', data.error);
      }
    } catch (error) {
      console.error('Failed to add test credits:', error);
    } finally {
      setIsAddingCredits(false);
    }
  };

  const CreditContent = () => (
    <Card className="w-full max-w-xs border-0 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          Credits Remaining
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-2xl font-bold">
            {isLoading ? 'Loading...' : credits}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Resets daily at midnight EST
            {lastReset && (
              <span className="block">
                Last reset: {new Date(lastReset).toLocaleString()}
              </span>
            )}
          </p>
        </div>
{/*         
        <Button 
          onClick={addTestCredits} 
          variant="outline" 
          size="sm"
          className="w-full"
          disabled={isAddingCredits}
        >
          {isAddingCredits ? 'Adding Credits...' : 'Add 10 Test Credits'}
        </Button> */}
      </CardContent>
    </Card>
  );

  if (showAsDialog) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {trigger || (
            <button className="flex items-center gap-1 text-sm">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="font-medium">{isLoading ? '...' : credits}</span>
            </button>
          )}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credit Balance</DialogTitle>
          </DialogHeader>
          <CreditContent />
        </DialogContent>
      </Dialog>
    );
  }

  return <CreditContent />;
} 