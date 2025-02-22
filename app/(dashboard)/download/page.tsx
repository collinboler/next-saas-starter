'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Download, Lock } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { SignInButton, useUser } from "@clerk/nextjs";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const URL_STORAGE_KEY = 'lastTikTokUrl';

export default function DownloadPage() {
    const { isSignedIn, isLoaded } = useUser();
    const searchParams = useSearchParams();
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [downloadLinks, setDownloadLinks] = useState<{ video: string; audio: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check URL parameter first
        const urlParam = searchParams.get('url');
        if (urlParam) {
            setUrl(urlParam);
            handleDownload(urlParam);
            localStorage.setItem(URL_STORAGE_KEY, urlParam);
            return;
        }

        // If no URL parameter, check localStorage
        const storedUrl = localStorage.getItem(URL_STORAGE_KEY);
        if (storedUrl) {
            setUrl(storedUrl);
            handleDownload(storedUrl);
        }
    }, [searchParams, isSignedIn]); // Re-run when auth state changes

    const handleUrlChange = (newUrl: string) => {
        setUrl(newUrl);
        localStorage.setItem(URL_STORAGE_KEY, newUrl);
    };

    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const fetchWithRetry = async (url: string, retries = MAX_RETRIES): Promise<any> => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(data.error);
            }
            return data;
        } catch (error) {
            if (retries > 0) {
                console.log(`Retrying... ${retries} attempts left`);
                await sleep(RETRY_DELAY);
                return fetchWithRetry(url, retries - 1);
            }
            throw error;
        }
    };

    const handleDownload = async (videoUrl: string = url) => {
        if (!videoUrl) return;
        setLoading(true);
        setError(null);
        setDownloadLinks(null);

        try {
            const cleanUrl = videoUrl.split('?')[0];
            console.log('Processing URL:', cleanUrl);

            const data = await fetchWithRetry(
                `/api/tiktok-download?url=${encodeURIComponent(cleanUrl)}`
            );

            console.log('API Response:', data);

            if (!data) {
                throw new Error('No response from API');
            }

            if (!data.video || !data.audio) {
                console.error('Invalid API response:', data);
                throw new Error('Could not get download links. The video might be private or deleted.');
            }

            setDownloadLinks({
                video: data.video,
                audio: data.audio
            });
        } catch (err) {
            console.error('Download error:', err);
            setError(
                err instanceof Error 
                    ? `Failed to process video: ${err.message}` 
                    : 'Failed to process video. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    const downloadFile = async (url: string, filename: string) => {
        if (!isSignedIn) {
            setError('Please sign in to download files');
            return;
        }

        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Download error:', err);
            setError('Failed to download file. Please try again.');
        }
    };

    const DownloadButton = ({ url, filename, variant = "default" }: { url: string; filename: string; variant?: "default" | "outline" }) => {
        if (!isLoaded) return null;

        if (!isSignedIn) {
            return (
                <SignInButton mode="modal">
                    <Button variant={variant} className="w-full">
                        <Lock className="mr-2 h-4 w-4" />
                        Sign in to Download
                    </Button>
                </SignInButton>
            );
        }

        return (
            <Button 
                onClick={() => downloadFile(url, filename)}
                variant={variant}
                className="w-full"
            >
                <Download className="mr-2 h-4 w-4" />
                Download {filename.includes('video') ? 'Video' : 'Audio'}
            </Button>
        );
    };

    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <h1 className="text-2xl font-bold mb-6">TikTok Video Downloader</h1>
            
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="tiktokUrl">TikTok Video URL</Label>
                    <Input
                        id="tiktokUrl"
                        placeholder="Paste TikTok video URL"
                        value={url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                    />
                </div>

                <Button
                    onClick={() => handleDownload()}
                    disabled={loading || !url}
                    className="w-full"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Download className="mr-2 h-4 w-4" />
                            Get Download Links
                        </>
                    )}
                </Button>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                )}

                {downloadLinks && (
                    <div className="space-y-6 mt-6">
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Video Preview</h2>
                            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                <video 
                                    src={downloadLinks.video}
                                    controls
                                    className="w-full h-full"
                                    playsInline
                                >
                                    Your browser does not support the video tag.
                                </video>
                            </div>
                            <DownloadButton 
                                url={downloadLinks.video}
                                filename="tiktok-video.mp4"
                            />
                        </div>

                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold">Audio Preview</h2>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <audio 
                                    src={downloadLinks.audio}
                                    controls
                                    className="w-full"
                                >
                                    Your browser does not support the audio tag.
                                </audio>
                            </div>
                            <DownloadButton 
                                url={downloadLinks.audio}
                                filename="tiktok-audio.mp3"
                                variant="outline"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 