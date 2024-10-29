import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import {ReactFlowProvider} from "@xyflow/react";
import App from "./graph/graph";
import {createRoot} from 'react-dom/client';

interface Video {
    url: string;
    start?: number;
    end?: number;
}

export const DjInterface: React.FC = () => {
    const [queue, setQueue] = useState<Video[]>([]);
    const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
    const [nextVideo, setNextVideo] = useState<Video | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    const [videoUrl, setVideoUrl] = useState<string>('');
    const [startTimestamp, setStartTimestamp] = useState<number>(0);
    const [endTimestamp, setEndTimestamp] = useState<number>(0);

    const currentPlayerRef = useRef<ReactPlayer | null>(null);
    const nextPlayerRef = useRef<ReactPlayer | null>(null);

    // Start playing the next video as the current video approaches its end
    useEffect(() => {
        if (currentVideo && currentPlayerRef.current) {
            const interval = setInterval(() => {
                const currentTime = currentPlayerRef.current?.getCurrentTime() || 0;
                const endTime = currentVideo.end || currentPlayerRef.current?.getDuration() || 0;

                if (nextVideo && currentTime >= endTime - 5 && !isTransitioning) {
                    startTransition();
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [currentVideo, nextVideo, isTransitioning]);

    const startTransition = () => {
        setIsTransitioning(true);

        if (nextPlayerRef.current && nextVideo) {
            nextPlayerRef.current.seekTo(nextVideo.start || 0);
            nextPlayerRef.current.setVolume(0);
            nextPlayerRef.current.getInternalPlayer().playVideo();

            const transitionDuration = 5; // 5-second crossfade

            const interval = setInterval(() => {
                if (currentPlayerRef.current && nextPlayerRef.current) {
                    let currentVolume = currentPlayerRef.current.getVolume();
                    let nextVolume = nextPlayerRef.current.getVolume();

                    if (currentVolume > 0) {
                        currentPlayerRef.current.setVolume(currentVolume - 0.2); // Reduce volume
                    }
                    if (nextVolume < 1) {
                        nextPlayerRef.current.setVolume(nextVolume + 0.2); // Increase volume
                    }

                    if (currentVolume <= 0 && nextVolume >= 1) {
                        clearInterval(interval);
                        completeTransition();
                    }
                }
            }, 1000);
        }
    };

    const completeTransition = () => {
        setIsTransitioning(false);
        setCurrentVideo(nextVideo);
        setNextVideo(null);

        // Remove played video from queue
        setQueue(queue.slice(1));
    };

    const addVideoToQueue = () => {
        const video: Video = {
            url: videoUrl,
            start: startTimestamp || undefined,
            end: endTimestamp || undefined,
        };

        setQueue([...queue, video]);
        setVideoUrl('');
        setStartTimestamp(0);
        setEndTimestamp(0);

        // Start playing if no video is currently playing
        if (!currentVideo) {
            setCurrentVideo(video);
        } else {
            setNextVideo(video);
        }
    };

    return (
        <div className="container mx-auto p-4">
            <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-6">
                <h1 className="text-3xl font-bold text-center mb-8">YouTube DJ Interface</h1>

                <div className="mb-6">
                    <input
                        type="text"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="YouTube Video URL"
                        className="input input-bordered w-full mb-4"
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="number"
                            value={startTimestamp}
                            onChange={(e) => setStartTimestamp(Number(e.target.value))}
                            placeholder="Start Time (seconds)"
                            className="input input-bordered w-full"
                        />
                        <input
                            type="number"
                            value={endTimestamp}
                            onChange={(e) => setEndTimestamp(Number(e.target.value))}
                            placeholder="End Time (seconds)"
                            className="input input-bordered w-full"
                        />
                    </div>
                    <button
                        onClick={addVideoToQueue}
                        className="btn btn-primary w-full mt-4"
                    >
                        Add to Queue
                    </button>
                </div>

                {/* Video Players */}
                <div className="relative">
                    {/* Current Video Player */}
                    {currentVideo && (
                        <ReactPlayer
                            ref={currentPlayerRef}
                            url={currentVideo.url}
                            playing={!isTransitioning}
                            volume={1}
                            controls
                            width="100%"
                            height="360px"
                            onReady={() => {
                                currentPlayerRef.current?.seekTo(currentVideo.start || 0);
                            }}
                            onEnded={() => completeTransition()}
                        />
                    )}
                    {/* Next Video Player (Hidden but used for transition) */}
                    {nextVideo && (
                        <ReactPlayer
                            ref={nextPlayerRef}
                            url={nextVideo.url}
                            playing={isTransitioning}
                            volume={0}
                            controls
                            width="100%"
                            height="360px"
                            style={{ position: 'absolute', top: 0, left: 0, opacity: isTransitioning ? 1 : 0 }}
                        />
                    )}
                </div>

                {/* Queue Display */}
                <h2 className="text-2xl font-semibold mb-4">Upcoming Videos</h2>
                <ul className="list-disc list-inside space-y-2">
                    {queue.slice(1).map((video, index) => (
                        <li key={index} className="text-lg">
                            {video.url}
                        </li>
                    ))}
                </ul>
            </div>

        </div>
    );
};

const root = createRoot(document.getElementById('music'));
root.render((
    <DjInterface />
));
