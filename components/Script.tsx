'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export function Script() {
    const [currentStep, setCurrentStep] = useState(1);
    const [scriptTopic, setScriptTopic] = useState("");
    const [referenceContent, setReferenceContent] = useState("");
    const [additionalStyle, setAdditionalStyle] = useState("");
    const [loading, setLoading] = useState(false);
    const [generatedScript, setGeneratedScript] = useState("");

    const trendingSuggestions = [
        "GI Jane Gym Apology Video",
        "Bye Bye Bye Mufasa Dance",
        "Olympics 2024: Coach Claudia Story",
        "Liz's $800,000 Prize Jump Reaction",
        "Squid Game Player 380 Story",
        "TikTok Dance Trends 2024",
        "Husky in the Snow Explained",
        "Family Gathering Moments"
    ];

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

    const handleNextStep = () => {
        setCurrentStep(prev => prev + 1);
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
                            <p className="text-sm text-gray-600 mb-2">Trending topic suggestions:</p>
                            <div className="flex flex-wrap gap-2">
                                {trendingSuggestions.map((suggestion, index) => (
                                    <Button
                                        key={index}
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setScriptTopic(suggestion);
                                            handleNextStep();
                                        }}
                                        className="text-xs"
                                    >
                                        {suggestion}
                                    </Button>
                                ))}
                            </div>
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
                    <div className="space-y-2">
                        <Label htmlFor="referenceContent">
                            2. Want to reference a specific video or account style?
                        </Label>
                        <Input
                            id="referenceContent"
                            placeholder="Paste a TikTok video link or account @ here..."
                            value={referenceContent}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReferenceContent(e.target.value)}
                        />
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

                {currentStep === 3 && (
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
                <Card className="mt-6 p-4">
                    <h2 className="text-xl font-semibold mb-2">Generated Script</h2>
                    <div className="whitespace-pre-wrap">{generatedScript}</div>
                </Card>
            )}
        </div>
    );
} 