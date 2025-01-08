'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight, CreditCard, Database, InfoIcon } from 'lucide-react';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { SignInButton, useAuth } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrendingTopic {
  topic: string;
  score: number;
}

type TrendingCategory = 'topics' | 'hashtags' | 'creators';

export default function HomePage() {
  const { isLoaded, userId } = useAuth();
  const router = useRouter();
  const [showReference, setShowReference] = useState(false);
  const [scriptTopic, setScriptTopic] = useState('');
  const [referenceVideo, setReferenceVideo] = useState('');
  const [trendingCategory, setTrendingCategory] = useState<TrendingCategory>('topics');
  const [trendingSuggestions, setTrendingSuggestions] = useState<TrendingTopic[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingTopic[]>([]);
  const [trendingCreators, setTrendingCreators] = useState<TrendingTopic[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  useEffect(() => {
    const fetchTrendingData = async () => {
      try {
        const response = await fetch('/api/trending-topics');
        const data = await response.json();
        if (data.topics) setTrendingSuggestions(data.topics);
        if (data.hashtags) setTrendingHashtags(data.hashtags);
        if (data.creators) setTrendingCreators(data.creators);
      } catch (error) {
        console.error('Error fetching trending data:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchTrendingData();
  }, []);

  const handleGenerateClick = () => {
    const inputs = {
      scriptTopic,
      showReference,
      referenceVideo: showReference ? referenceVideo : '',
      selectedTopics
    };
    localStorage.setItem('scriptInputs', JSON.stringify(inputs));
  };

  const handleShowMore = () => {
    const increment = 8;
    const selectedCount = selectedTopics.length;
    setVisibleCount(prev => Math.min(prev + increment, getCurrentTotalCount() - selectedCount));
  };

  const getCurrentTotalCount = () => {
    switch (trendingCategory) {
      case 'hashtags': return trendingHashtags.length;
      case 'creators': return trendingCreators.length;
      default: return trendingSuggestions.length;
    }
  };

  const getCurrentTrendingItems = () => {
    const selectedCount = selectedTopics.length;
    const adjustedVisibleCount = visibleCount + selectedCount;
    
    switch (trendingCategory) {
      case 'hashtags':
        return trendingHashtags.slice(0, adjustedVisibleCount);
      case 'creators':
        return trendingCreators.slice(0, adjustedVisibleCount).map(item => ({
          ...item,
          topic: `@${item.topic}`
        }));
      default:
        return trendingSuggestions.slice(0, adjustedVisibleCount);
    }
  };

  const handleTopicClick = (topic: string) => {
    if (!selectedTopics.includes(topic)) {
      const newSelectedTopics = [...selectedTopics, topic];
      setSelectedTopics(newSelectedTopics);
      setScriptTopic(newSelectedTopics.join('; '));
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    const newSelectedTopics = selectedTopics.filter(topic => topic !== topicToRemove);
    setSelectedTopics(newSelectedTopics);
    setScriptTopic(newSelectedTopics.join('; '));
  };

  const getScoreColor = (score: number, category: TrendingCategory) => {
    if (category === 'creators') {
      const maxRank = trendingCreators.length;
      const normalizedScore = 1 - ((score - 1) / (maxRank - 1));
      const red = Math.round(normalizedScore * 255);
      const blue = Math.round((1 - normalizedScore) * 255);
      return `rgb(${red}, 0, ${blue})`;
    } else {
      const normalizedScore = score / 100;
      const red = Math.round(normalizedScore * 255);
      const blue = Math.round((1 - normalizedScore) * 255);
      return `rgb(${red}, 0, ${blue})`;
    }
  };

  const filteredVisibleItems = getCurrentTrendingItems()
    .filter(item => !selectedTopics.includes(item.topic))
    .slice(0, visibleCount);

  if (!isLoaded) {
    return null;
  }

  if (userId) {
    return (
      <main>
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight sm:text-5xl md:text-6xl mb-4">
                Welcome back!
              </h1>
              <p className="text-xl text-gray-500 mb-8">
                Continue creating viral TikTok scripts
              </p>
              <Link href="/viralgo">
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white text-lg py-6 px-8"
                >
                  Go to Script Generator
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight sm:text-5xl md:text-6xl mb-4">
              Go Viral with
              <span className="text-orange-500"> ViralGo</span>
            </h1>
            <p className="text-xl text-gray-500">
              Generate viral TikTok scripts powered by AI
            </p>
          </div>
          
          {/* Preview Script Generator */}
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="space-y-4">
                <Label htmlFor="scriptTopic" className="text-lg font-medium">What's your video about?</Label>
                <Textarea
                  id="scriptTopic"
                  placeholder="Enter your script topic or idea..."
                  className="min-h-[60px] text-lg resize-none"
                  value={scriptTopic}
                  onChange={(e) => setScriptTopic(e.target.value)}
                />

                {/* Selected Topics */}
                <div className={`${selectedTopics.length > 0 ? 'block' : 'hidden'}`}>
                  <div className="text-sm text-muted-foreground mb-2">Selected Topics:</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTopics.map((topic) => {
                      let originalSuggestion: TrendingTopic | undefined;
                      let category: TrendingCategory = 'topics';

                      if (topic.startsWith('@')) {
                        originalSuggestion = trendingCreators.find(s => `@${s.topic}` === topic);
                        category = 'creators';
                      } else if (topic.startsWith('#')) {
                        originalSuggestion = trendingHashtags.find(s => `#${s.topic}` === topic);
                        category = 'hashtags';
                      } else {
                        originalSuggestion = trendingSuggestions.find(s => s.topic === topic);
                      }

                      const backgroundColor = originalSuggestion 
                        ? getScoreColor(originalSuggestion.score, category)
                        : 'hsl(var(--primary))';
                      
                      return (
                        <TooltipProvider key={topic}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div 
                                className="flex items-center rounded-full text-xs"
                                style={{
                                  backgroundColor,
                                  borderColor: backgroundColor,
                                }}
                              >
                                <span className="px-3 py-1 text-white">{topic}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveTopic(topic);
                                  }}
                                  className="pr-2 pl-0 text-white/80 hover:text-white"
                                >
                                  ×
                                </button>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{category === 'creators' ? `Rank #${originalSuggestion?.score}` : `${originalSuggestion?.score}%`}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </div>

                <SignInButton mode="modal">
                  <Button 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6"
                    disabled={!scriptTopic.trim() || (showReference && !referenceVideo.trim())}
                    onClick={() => {
                      handleGenerateClick();
                      router.push('/viralgo');
                    }}
                  >
                    Generate Script
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </SignInButton>

                {/* Trending Section */}
                <div className="mt-8">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Add Trending</span>
                      <select
                        value={trendingCategory}
                        onChange={(e) => {
                          setTrendingCategory(e.target.value as TrendingCategory);
                          setVisibleCount(3);
                        }}
                        className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="topics">Topics</option>
                        <option value="hashtags">Hashtags</option>
                        <option value="creators">Creators</option>
                      </select>
                      <span className="text-sm">on</span>
                      <span className="font-bold flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="inline-block">
                          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                        </svg>
                        TikTok
                      </span>
                      <span className="text-sm">in</span>
                      <span className="font-bold flex items-center gap-1">
                        USA 🇺🇸
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <InfoIcon className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>Support for more countries and platforms coming soon.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {loadingSuggestions ? (
                      <div className="text-sm text-muted-foreground">Loading trending items...</div>
                    ) : (
                      filteredVisibleItems.map((item, index) => (
                        <div
                          key={item.topic}
                          className="suggestion-button opacity-0 translate-y-4 scale-95"
                          style={{
                            animation: `fadeInUp 0.3s ease-out forwards ${index * 0.1}s`
                          }}
                        >
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleTopicClick(item.topic)}
                                  className="text-xs text-white transition-all"
                                  style={{
                                    backgroundColor: getScoreColor(item.score, trendingCategory),
                                    borderColor: getScoreColor(item.score, trendingCategory),
                                  }}
                                >
                                  {item.topic}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{trendingCategory === 'creators' ? `Rank #${item.score}` : `${item.score}%`}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      ))
                    )}
                  </div>

                  {visibleCount < getCurrentTotalCount() && (
                    <div 
                      className="show-more-button opacity-0"
                      style={{
                        animation: 'fadeIn 0.3s ease-out 0.5s forwards'
                      }}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleShowMore}
                        className="mt-2"
                      >
                        Show More
                      </Button>
                    </div>
                  )}

                  <style jsx>{`
                    @keyframes fadeInUp {
                      from {
                        opacity: 0;
                        transform: translateY(1rem) scale(0.95);
                      }
                      to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                      }
                    }
                    @keyframes fadeIn {
                      from {
                        opacity: 0;
                      }
                      to {
                        opacity: 1;
                      }
                    }
                  `}</style>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 py-2">
                <Switch 
                  id="reference-mode" 
                  checked={showReference}
                  onCheckedChange={setShowReference}
                />
                <Label htmlFor="reference-mode" className="text-base text-gray-600 dark:text-gray-400">Base this script off a reference video</Label>
              </div>

              {showReference && (
                <div className="space-y-2">
                  <Label htmlFor="referenceVideo" className="text-lg font-medium">TikTok Video URL</Label>
                  <Input
                    id="referenceVideo"
                    placeholder="Paste TikTok video URL"
                    type="url"
                    value={referenceVideo}
                    onChange={(e) => setReferenceVideo(e.target.value)}
                    className="text-lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
