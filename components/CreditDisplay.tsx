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

interface CreditDisplayProps {
  showAsDialog?: boolean;
  trigger?: React.ReactNode;
}

export function CreditDisplay({ showAsDialog = false, trigger }: CreditDisplayProps) {
  const { user } = useUser();
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    const fetchCredits = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/credits');
        const data = await response.json();

        if (response.ok) {
          setCredits(data.credits);
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      }
    };

    fetchCredits();
    // Poll for updates every minute
    const interval = setInterval(fetchCredits, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const CreditContent = () => (
    <Card className="w-full max-w-xs border-0 shadow-none">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-yellow-500" />
          Credits Remaining
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{credits}</p>
        <p className="text-xs text-muted-foreground mt-1">Resets daily at midnight EST</p>
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
              <span className="font-medium">{credits}</span>
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