'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, TrendingUp, Heart, MessageCircle, Share2 } from 'lucide-react';

export function Terminal() {
  const [followerCount, setFollowerCount] = useState(1000);
  const [copied, setCopied] = useState(false);
  const [graphPoints, setGraphPoints] = useState<number[]>([]);
  const targetFollowers = 1000000; // 1M followers
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setFollowerCount(prev => {
        const increase = Math.floor(prev * 0.1);
        const next = prev + increase;
        return next >= targetFollowers ? targetFollowers : next;
      });

      setGraphPoints(prev => {
        const newPoint = Math.random() * 50 + 50; // Random value between 50-100
        return [...prev, newPoint].slice(-20); // Keep last 20 points
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`Follow @viralgo on TikTok! We grew from 1K to ${formatNumber(targetFollowers)} followers!`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-black text-white relative">
      <div className="relative aspect-[16/9] bg-gradient-to-b from-gray-900 to-black p-4">
        {/* Graph Animation */}
        <div className="absolute inset-0 flex items-end justify-between px-4 pb-12 opacity-30">
          {graphPoints.map((point, i) => (
            <div
              key={i}
              className="w-1 bg-pink-500 rounded-t transition-all duration-200 ease-out"
              style={{ height: `${point}%` }}
            />
          ))}
        </div>

        {/* TikTok-style Content */}
        <div className="absolute inset-0 flex flex-col justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-pink-500 to-orange-500 p-[2px]">
              <div className="h-full w-full rounded-full bg-black p-[2px]">
                <div className="h-full w-full rounded-full bg-gradient-to-tr from-pink-500 to-orange-500" />
              </div>
            </div>
            <div>
              <h3 className="font-bold">@viralgo</h3>
              <p className="text-sm text-gray-400">Going viral...</p>
            </div>
          </div>

          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <div className="text-4xl font-bold tracking-tighter">
                {formatNumber(followerCount)}
                <span className="text-lg ml-2 text-pink-500">followers</span>
              </div>
              <div className="text-sm">
                {followerCount >= targetFollowers ? (
                  "🚀 We've reached 1M followers!"
                ) : (
                  "📈 Watch us grow in real-time"
                )}
              </div>
            </div>

            {/* TikTok-style Interaction Buttons */}
            <div className="flex space-x-4">
              <button className="flex flex-col items-center">
                <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                  <Heart className="h-5 w-5" />
                </div>
                <span className="text-xs mt-1">123.4K</span>
              </button>
              <button className="flex flex-col items-center">
                <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <span className="text-xs mt-1">1.2K</span>
              </button>
              <button onClick={copyToClipboard} className="flex flex-col items-center">
                <div className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center">
                  {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
                </div>
                <span className="text-xs mt-1">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
