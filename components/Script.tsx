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

    useEffect(() => {
        const fetchTrendingTopics = async () => {
            try {
                const response = await fetch('/api/trending-topics');
                const data = await response.json();
                if (data.topics) {
                    setTrendingSuggestions(data.topics);
                }
            } catch (error) {
                console.error('Error fetching trending topics:', error);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        fetchTrendingTopics();
    }, []);

    const handleShowMore = () => {
        setVisibleCount(prev => Math.min(prev + 8, trendingSuggestions.length));
    };

    const visibleSuggestions = trendingSuggestions.slice(0, visibleCount);

    // Function to generate color based on score
    const getScoreColor = (score: number) => {
        // Convert score to a value between 0 and 1
        const normalizedScore = score / 100;
        
        // Generate RGB values
        // Red component increases with score
        // Blue component decreases with score
        const red = Math.round(normalizedScore * 255);
        const blue = Math.round((1 - normalizedScore) * 255);
        
        return `rgb(${red}, 0, ${blue})`;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
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
                    style: additionalStyle,
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
            // First get the oEmbed data
            const oembedResponse = await fetch(
                `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
            );
            const oembedData = await oembedResponse.json();
            setEmbedHtml(oembedData.html);
    
            // Then get the transcription
            const response = await fetch('/api/process-tiktok', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url }),
            });
    
            if (!response.ok) {
                throw new Error('Failed to process video');
            }
    
            const data = await response.json();
            if (data.transcription) {
                setTranscription(data.transcription);
            }
        } catch (error) {
            console.error('Error processing video:', error);
            // Handle error appropriately
        } finally {
            setProcessingVideo(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">TikTok Script Generator</h1>
            <form onSubmit={handleSubmit} className="space-y-6">
                {currentStep === 1 && (
                    <div className="space-y-2">
                        <Label htmlFor="scriptTopic">1. What's your script topic/idea?</Label>
                        <Textarea
                            id="scriptTopic"
                            placeholder="Enter your script topic or idea..."
                            value={scriptTopic}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setScriptTopic(e.target.value)}
                            className="min-h-[100px]"
                        />
                        <div className="mt-2">
                            <div className="flex items-center gap-2 mb-2">
                                <p className="text-sm text-gray-600">Trending topic suggestions:</p>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <InfoIcon className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p>These are the current top TikTok searched terms right now in the United States. More support is coming for other countries soon.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {loadingSuggestions ? (
                                    <div className="text-sm text-gray-500">Loading trending topics...</div>
                                ) : (
                                    visibleSuggestions.map((suggestion, index) => (
                                        <div
                                            key={suggestion.topic}
                                            className="suggestion-button opacity-0 translate-y-4 scale-95"
                                            style={{
                                                animation: `fadeInUp 0.3s ease-out forwards ${index * 0.1}s`
                                            }}
                                        >
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setScriptTopic(suggestion.topic)}
                                                        className="text-xs text-white transition-all"
                                                        style={{
                                                            backgroundColor: getScoreColor(suggestion.score),
                                                            borderColor: getScoreColor(suggestion.score),
                                                        }}
                                                    >
                                                        {suggestion.topic}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Virality Score: {suggestion.score}%</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </div>
                                    ))
                                )}
                            </div>
                            {visibleCount < trendingSuggestions.length && (
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
                                        className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                                    >
                                        Show More Suggestions ({trendingSuggestions.length - visibleCount} more)
                                    </Button>
                                </div>
                            )}
                        </div>
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
                            2. Want to reference a specific video or account style?
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
                            3. Any additional style preferences? (Optional)
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
                        <div className="whitespace-pre-wrap">{generatedScript}</div>
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