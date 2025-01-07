'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";
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

// Add type for trending category
type TrendingCategory = 'topics' | 'hashtags' | 'creators';

export function Script() {
    const [currentStep, setCurrentStep] = useState(1);
    const [scriptTopic, setScriptTopic] = useState("");
    const [referenceContent, setReferenceContent] = useState("");
    const [additionalStyle, setAdditionalStyle] = useState("");
    const [loading, setLoading] = useState(false);
    const [generatedScript, setGeneratedScript] = useState("");
    const [visibleCount, setVisibleCount] = useState(3);
    const [trendingSuggestions, setTrendingSuggestions] = useState<TrendingTopic[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);
    const [remixInput, setRemixInput] = useState("");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [transcription, setTranscription] = useState<string | null>(null);
    const [processingVideo, setProcessingVideo] = useState(false);
    const [embedHtml, setEmbedHtml] = useState<string | null>(null);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const [trendingCategory, setTrendingCategory] = useState<TrendingCategory>('topics');
    const [trendingHashtags, setTrendingHashtags] = useState<TrendingTopic[]>([]);
    const [trendingCreators, setTrendingCreators] = useState<TrendingTopic[]>([]);

    useEffect(() => {
        const fetchTrendingData = async () => {
            try {
                const response = await fetch('/api/trending-topics');
                const data = await response.json();
                if (data.topics) {
                    setTrendingSuggestions(data.topics);
                }
                if (data.hashtags) {
                    setTrendingHashtags(data.hashtags);
                }
                if (data.creators) {
                    setTrendingCreators(data.creators);
                }
            } catch (error) {
                console.error('Error fetching trending data:', error);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        fetchTrendingData();
    }, []);

    const handleShowMore = () => {
        setVisibleCount(prev => Math.min(prev + 8, trendingSuggestions.length));
    };

    const visibleSuggestions = trendingSuggestions.slice(0, visibleCount);

    // Filter out selected topics from visible suggestions
    const filteredVisibleSuggestions = visibleSuggestions.filter(
        suggestion => !selectedTopics.includes(suggestion.topic)
    );

    // Function to generate color based on score or rank
    const getScoreColor = (score: number, category: TrendingCategory) => {
        if (category === 'creators') {
            // For creators, score is their rank (lower is better)
            // Convert rank to a percentage where rank 1 = 100% and max rank = 0%
            const maxRank = trendingCreators.length;
            const normalizedScore = 1 - ((score - 1) / (maxRank - 1));
            const red = Math.round(normalizedScore * 255);
            const blue = Math.round((1 - normalizedScore) * 255);
            return `rgb(${red}, 0, ${blue})`;
        } else {
            // For topics and hashtags, use percentage-based coloring
            const normalizedScore = score / 100;
            const red = Math.round(normalizedScore * 255);
            const blue = Math.round((1 - normalizedScore) * 255);
            return `rgb(${red}, 0, ${blue})`;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const finalMessage = {
            role: "user",
            content: `Topic: ${scriptTopic}
            ${referenceContent ? `Reference Content: ${referenceContent}` : ''}
            ${transcription ? `Video Analysis: ${transcription}` : ''}
            ${additionalStyle ? `Style Preferences: ${additionalStyle}` : ''}`
        };

        // Add the console.log here
        console.log("Final message being sent to assistant:", finalMessage);

        try {
            const response = await fetch("/api/generate-script", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    topic: scriptTopic,
                    reference: referenceContent,
                    style: additionalStyle
                }),
            });
            const data = await response.json();
            setGeneratedScript(data.script);
        } catch (error) {
            console.error("Error generating script:", error);
        }
        setLoading(false);
    };

    const handleRemix = async () => {
        if (!remixInput.trim()) return;
        setLoading(true);
        try {
            const response = await fetch("/api/generate-script", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    topic: scriptTopic,
                    reference: referenceContent,
                    style: remixInput,
                }),
            });
            const data = await response.json();
            setGeneratedScript(data.script);
            setRemixInput("");
        } catch (error) {
            console.error("Error remixing script:", error);
        }
        setLoading(false);
    };

    const handleNextStep = () => {
        setCurrentStep(prev => prev + 1);
    };

    const handleVideoProcess = async (url: string) => {
        setProcessingVideo(true);
        try {
            // Clean up the TikTok URL by removing query parameters
            const cleanUrl = url.split('?')[0];
            
            // First get the oEmbed data
            const oembedResponse = await fetch(
                `https://www.tiktok.com/oembed?url=${encodeURIComponent(cleanUrl)}`
            );
            
            if (!oembedResponse.ok) {
                throw new Error('Failed to fetch TikTok embed data');
            }
            
            const oembedData = await oembedResponse.json();
            setEmbedHtml(oembedData.html);

            // Extract additional metadata from oEmbed response
            const metadata = {
                caption: oembedData.title || '',
                username: oembedData.author_name || '',
                soundTitle: oembedData.music_name || '',
                soundLink: oembedData.music_url || '',
            };

            // Then get the transcription with additional metadata
            const response = await fetch('/api/process-tiktok', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    url: cleanUrl,
                    metadata 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to process video');
            }

            const data = await response.json();
            if (data.transcription) {
                // Extract just the transcription part from the enriched response
                const transcriptionOnly = data.transcription.split('Transcription:')[1]?.trim() || data.transcription;
                setTranscription(transcriptionOnly);
            }
        } catch (error) {
            console.error('Error processing video:', error);
            // Show error to user instead of just logging
            alert(error instanceof Error ? error.message : 'Failed to process video');
        } finally {
            setProcessingVideo(false);
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

    // Get current trending items based on category
    const getCurrentTrendingItems = () => {
        switch (trendingCategory) {
            case 'hashtags':
                return trendingHashtags.slice(0, visibleCount);
            case 'creators':
                return trendingCreators.slice(0, visibleCount).map(item => ({
                    ...item,
                    topic: `@${item.topic}`
                }));
            default:
                return trendingSuggestions.slice(0, visibleCount);
        }
    };

    // Get total count for current category
    const getCurrentTotalCount = () => {
        switch (trendingCategory) {
            case 'hashtags':
                return trendingHashtags.length;
            case 'creators':
                return trendingCreators.length;
            default:
                return trendingSuggestions.length;
        }
    };

    // Filter selected items from current category
    const filteredVisibleItems = getCurrentTrendingItems().filter(
        item => !selectedTopics.includes(item.topic)
    );

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">TikTok Script Generator</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                {currentStep === 1 && (
                    <div className="space-y-4">
                        <Label htmlFor="scriptTopic"><b>[1/3]</b> What's your video about?</Label>

                        <Textarea
                            id="scriptTopic"
                            placeholder="Enter your script topic or idea..."
                            value={scriptTopic}
                            onChange={(e) => setScriptTopic(e.target.value)}
                            className="min-h-[100px]"
                        />
                        
                        {/* Selected Topics Section */}
                        <div className={`${selectedTopics.length > 0 ? 'block' : 'hidden'}`}>
                            <div className="text-sm text-muted-foreground mb-2">Selected Topics:</div>
                            <div className="flex flex-wrap gap-2">
                                {selectedTopics.map((topic) => {
                                    // Find the original suggestion from all categories
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
                        
                        {/* Trending Section */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between gap-2 mb-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm">Trending</span>
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

                        <Button 
                            type="button" 
                            className="w-full mt-4" 
                            onClick={handleNextStep}
                            disabled={!scriptTopic.trim()}
                        >
                            Next
                        </Button>
                    </div>
                )}

                {currentStep === 2 && (
                    <div className="space-y-4">
                        <Label htmlFor="referenceContent">
                            <b>[2/3]</b> Input TikTok Video URL for style reference <i>(Optional)</i>
                        </Label>
                        <div className="space-y-2">
                            <Input
                                id="referenceContent"
                                placeholder="Paste a TikTok video link or account @ here..."
                                value={referenceContent}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setReferenceContent(e.target.value);
                                    // Reset video and transcription when input changes
                                    setVideoUrl(null);
                                    setTranscription(null);
                                }}
                            />
                            {referenceContent.includes('tiktok.com') && (
                                <Button
                                    type="button"
                                    onClick={() => handleVideoProcess(referenceContent)}
                                    disabled={processingVideo}
                                    className="w-full"
                                >
                                    {processingVideo ? "Processing Video..." : "Process TikTok Video"}
                                </Button>
                            )}
                        </div>
                        <script async src="https://www.tiktok.com/embed.js"></script>
                        
                        {referenceContent.includes('tiktok.com') && (
                    <div className="mt-4 space-y-4">
                        {embedHtml ? (
                            <div 
                                className="relative aspect-video w-full"
                                dangerouslySetInnerHTML={{ __html: embedHtml }}
                            />
                        ) : (
                            <div className="w-full h-64 bg-gray-100 dark:bg-gray-900 rounded-lg flex items-center justify-center">
                                <p className="text-gray-500">Loading TikTok embed...</p>
                            </div>
                        )}
                        {transcription && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                <h3 className="text-sm font-medium mb-2">Video Transcription:</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{transcription}</p>
                            </div>
                        )}
                    </div>
                )}
                        
                        <p className="text-xs text-gray-500">
                            This helps match the style of your favorite creators
                        </p>
                        <Button 
                            type="button" 
                            className="w-full mt-4" 
                            onClick={handleNextStep}
                        >
                            Next
                        </Button>
                    </div>
                )}

                {currentStep === 3 && !generatedScript && (
                    <div className="space-y-2">
                        <Label htmlFor="additionalStyle">
                            <b>[3/3]</b> Additional notes? (Optional)
                        </Label>
                        <Textarea
                            id="additionalStyle"
                            placeholder="E.g., Funny and energetic, Educational and calm, Storytelling format..."
                            value={additionalStyle}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAdditionalStyle(e.target.value)}
                        />
                        <Button type="submit" className="w-full mt-4" disabled={loading}>
                            {loading ? "Generating..." : "Generate Script"}
                        </Button>
                    </div>
                )}
            </form>

            {generatedScript && (
    <div className="space-y-6">
        <Card className="p-4">
            <h2 className="text-xl font-semibold mb-2">Generated Script</h2>
            <div className="whitespace-pre-wrap">
                {generatedScript.split('\n').map((line, index) => {
                    const parts = [];
                    let currentText = '';
                    let i = 0;

                    // Check if line starts with ###
                    const isHeading = line.trim().startsWith('###');
                    const lineClass = isHeading ? "text-xl font-semibold" : "mb-2";

                    while (i < line.length) {
                        if (line[i] === '*') {
                            if (line[i + 1] === '*') {
                                // Bold text
                                if (currentText) {
                                    parts.push(currentText);
                                    currentText = '';
                                }
                                i += 2;
                                let boldText = '';
                                while (i < line.length && !(line[i] === '*' && line[i + 1] === '*')) {
                                    boldText += line[i];
                                    i++;
                                }
                                if (boldText) {
                                    parts.push(<strong key={`bold-${i}`}>{boldText}</strong>);
                                }
                                i += 2;
                            } else {
                                // Italic text
                                if (currentText) {
                                    parts.push(currentText);
                                    currentText = '';
                                }
                                i++;
                                let italicText = '';
                                while (i < line.length && line[i] !== '*') {
                                    italicText += line[i];
                                    i++;
                                }
                                if (italicText) {
                                    parts.push(<em key={`italic-${i}`}>{italicText}</em>);
                                }
                                i++;
                            }
                        } else {
                            currentText += line[i];
                            i++;
                        }
                    }

                    if (currentText) {
                        parts.push(currentText);
                    }

                    return (
                        <p key={index} className={lineClass}>
                            {isHeading ? line.replace('###', '').trim() : parts}
                        </p>
                    );
                })}
            </div>
        </Card>
                    
                    <div className="flex gap-2">
                        <Input
                            placeholder="Enter remix instructions (e.g., 'Make it funnier' or 'Add more storytelling')"
                            value={remixInput}
                            onChange={(e) => setRemixInput(e.target.value)}
                            className="flex-1"
                        />
                        <Button 
                            onClick={handleRemix}
                            disabled={loading || !remixInput.trim()}
                        >
                            {loading ? "Remixing..." : "Remix"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
} 