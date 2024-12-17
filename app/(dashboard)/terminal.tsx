'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, TrendingUp, Heart, MessageCircle, Share2, MoreHorizontal, Send } from 'lucide-react';

// Add the verified badge SVG component
const VerifiedBadge = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 20 20" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className="inline-block ml-1"
  >
    <circle cx="10" cy="10" r="10" fill="#20D5EC"/>
    <path
      d="M5.5 10L8.5 13L14.5 7"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function Terminal() {
  const [followerCount, setFollowerCount] = useState(1000);
  const [likeCount, setLikeCount] = useState(5000);
  const [followingCount] = useState(14); // Static count from image
  const [copied, setCopied] = useState(false);
  const [graphPoints, setGraphPoints] = useState<number[]>([]);
  
  const targetFollowers = 69000000; // 83.2M followers
  const targetLikes = 420000000; // 335.6M likes
  
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  useEffect(() => {
    setGraphPoints(Array(20).fill(0).map((_, i) => 20 + (i * 2)));

    const timer = setInterval(() => {
      setFollowerCount(prev => {
        const increase = Math.floor(prev * 0.1);
        const next = prev + increase;
        return next >= targetFollowers ? targetFollowers : next;
      });

      setLikeCount(prev => {
        const increase = Math.floor(prev * 0.12);
        const next = prev + increase;
        return next >= targetLikes ? targetLikes : next;
      });

      setGraphPoints(prev => {
        const lastPoint = prev[prev.length - 1];
        const volatility = Math.random() * 10 - 2;
        const trendStrength = 2;
        const newPoint = Math.min(
          Math.max(lastPoint + trendStrength + volatility, 20),
          95
        );
        return [...prev.slice(1), newPoint];
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(
      `Follow @viralgo on TikTok! We grew from 1K to ${formatNumber(targetFollowers)} followers with ${formatNumber(targetLikes)} likes!`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const createPathFromPoints = (points: number[]): string => {
    if (points.length < 2) return '';
    const height = 100;
    const width = 100;
    const xStep = width / (points.length - 1);
    return points.reduce((path, point, i) => {
      const x = i * xStep;
      const y = height - point;
      return path + `${i === 0 ? 'M' : 'L'} ${x},${y}`;
    }, '');
  };

  return (
    <div className="w-[800px] h-[300px] rounded-2xl overflow-hidden bg-background text-foreground relative">
      <div className="relative w-full h-full bg-gradient-to-b from-muted to-background p-4">
        {/* Background Graph - keeping the existing graph animation */}
        <div className="absolute inset-0">
          <svg
            className="w-full h-full opacity-30"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(236, 72, 153)" stopOpacity="1" />
                <stop offset="100%" stopColor="rgb(236, 72, 153)" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(236, 72, 153)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="rgb(236, 72, 153)" stopOpacity="0" />
              </linearGradient>
            </defs>
            
            <path
              d={`${createPathFromPoints(graphPoints)} L 100,100 L 0,100 Z`}
              fill="url(#areaGradient)"
            />
            
            <path
              d={createPathFromPoints(graphPoints)}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="0.5"
            />
          </svg>
        </div>

        {/* TikTok Profile Layout */}
        <div className="absolute inset-0 flex flex-col p-6">
          {/* Header with Profile Info */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-16 w-16 rounded-full bg-[#7fffd4] flex items-center justify-center">
                <span className="text-black font-bold text-xs">ViralGo</span>
              </div>
              <div>
                <div className="flex items-center">
                  <span className="font-bold text-xl">viralgo</span>
                  <VerifiedBadge />
                </div>
                <h2 className="font-bold text-xl">Go Viral with AI</h2>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mb-6">
            <button className="bg-primary text-primary-foreground px-8 py-2 rounded-md font-semibold">
              Follow
            </button>
            <button className="bg-secondary text-secondary-foreground px-8 py-2 rounded-md">
              Message
            </button>
            <button className="bg-[#2F2F2F] p-2 rounded-md">
              <Send className="h-5 w-5" />
            </button>
            <button className="bg-[#2F2F2F] p-2 rounded-md">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex space-x-4 mb-3">
            <div className="flex items-baseline">
              <div className="w-8 text-right font-bold">{followingCount}</div>
              <span className="text-muted-foreground ml-1 text-sm whitespace-nowrap">Following</span>
            </div>
            <div className="flex items-baseline">
              <div className="w-16 text-right font-bold">{formatNumber(followerCount)}</div>
              <span className="text-muted-foreground ml-1 text-sm whitespace-nowrap">Followers</span>
            </div>
            <div className="flex items-baseline">
              <div className="w-16 text-right font-bold">{formatNumber(likeCount)}</div>
              <span className="text-muted-foreground ml-1 text-sm whitespace-nowrap">Likes</span>
            </div>
          </div>

          {/* Bio */}
          <p className="text-lg mb-4">Try free today!</p>
          
          {/* Link */}
          <a href="#" className="text-[#FE2C55] mb-4">
            https://viralgo.tech
          </a>
        </div>
      </div>
    </div>
  );
}
