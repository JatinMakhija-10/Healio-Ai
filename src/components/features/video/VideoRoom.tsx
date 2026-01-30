"use client";

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Phone,
    PhoneOff,
    Monitor,
    MessageSquare,
    Settings,
    Users,
    PictureInPicture2,
    Maximize2,
    Clock
} from 'lucide-react';
import { useVideoCall } from '@/hooks/useVideoCall';
import { VideoControls } from './VideoControls';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoRoomProps {
    appointmentId: string;
    roomUrl?: string;
    patientName: string;
    patientAvatar?: string;
    onCallEnd?: () => void;
    className?: string;
}

export function VideoRoom({
    appointmentId,
    roomUrl = 'https://healio.daily.co/room-demo', // Mock URL
    patientName,
    patientAvatar,
    onCallEnd,
    className,
}: VideoRoomProps) {
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const {
        callStatus,
        isInCall,
        isMuted,
        isVideoOff,
        isScreenSharing,
        isChatOpen,
        formattedDuration,
        joinCall,
        leaveCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        toggleChat,
    } = useVideoCall();

    // Initialize local video preview
    useEffect(() => {
        async function initLocalVideo() {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                if (localVideoRef.current) {
                    localVideoRef.current.srcObject = stream;
                }
            } catch (error) {
                console.error('Failed to get local media:', error);
            }
        }

        if (isInCall) {
            initLocalVideo();
        }

        return () => {
            // Cleanup streams
            if (localVideoRef.current?.srcObject) {
                const stream = localVideoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [isInCall]);

    // Auto-join call on mount
    useEffect(() => {
        if (callStatus === 'idle' && roomUrl) {
            joinCall(roomUrl, appointmentId);
        }
    }, [callStatus, roomUrl, appointmentId, joinCall]);

    const handleEndCall = () => {
        leaveCall();
        onCallEnd?.();
    };

    return (
        <div className={cn(
            "relative bg-slate-900 rounded-2xl overflow-hidden",
            isFullscreen ? "fixed inset-0 z-50 rounded-none" : "h-[600px]",
            className
        )}>
            {/* Connection Status Overlay */}
            <AnimatePresence>
                {callStatus === 'connecting' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-900/90 z-20 flex items-center justify-center"
                    >
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            <p className="text-white text-lg font-medium">Connecting...</p>
                            <p className="text-slate-400 text-sm">Setting up secure video call</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Video (Remote / Screen Share) */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900">
                {isScreenSharing ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <div className="text-center space-y-2">
                            <Monitor className="h-16 w-16 text-teal-500 mx-auto" />
                            <p className="text-white">Screen sharing active</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Remote Video Placeholder */}
                        <div className="w-full h-full flex items-center justify-center">
                            <div className="text-center space-y-4">
                                <Avatar className="h-32 w-32 mx-auto ring-4 ring-slate-700">
                                    <AvatarImage src={patientAvatar} />
                                    <AvatarFallback className="text-4xl bg-slate-700 text-slate-300">
                                        {patientName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-white text-xl font-medium">{patientName}</p>
                                    <p className="text-slate-400">Waiting for video...</p>
                                </div>
                            </div>
                        </div>
                        <video
                            ref={remoteVideoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                    </>
                )}
            </div>

            {/* Local Video (Picture-in-Picture) */}
            <motion.div
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                className="absolute bottom-24 right-4 w-48 h-36 rounded-xl overflow-hidden shadow-2xl border-2 border-slate-700 bg-slate-800"
            >
                {isVideoOff ? (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800">
                        <VideoOff className="h-8 w-8 text-slate-500" />
                    </div>
                ) : (
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover mirror"
                    />
                )}
                <div className="absolute bottom-2 left-2">
                    <Badge variant="outline" className="bg-slate-900/80 text-white border-slate-700 text-xs">
                        You
                    </Badge>
                </div>
            </motion.div>

            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-slate-900/80 to-transparent">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 rounded-full">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-white text-sm font-medium">LIVE</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-full">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-white text-sm font-mono">{formattedDuration}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 transition-colors"
                        >
                            <Maximize2 className="h-5 w-5 text-white" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Controls Bar */}
            <VideoControls
                isMuted={isMuted}
                isVideoOff={isVideoOff}
                isScreenSharing={isScreenSharing}
                isChatOpen={isChatOpen}
                onToggleMute={toggleMute}
                onToggleVideo={toggleVideo}
                onToggleScreenShare={toggleScreenShare}
                onToggleChat={toggleChat}
                onEndCall={handleEndCall}
            />

            {/* Chat Sidebar */}
            <AnimatePresence>
                {isChatOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        className="absolute top-0 right-0 bottom-0 w-80 bg-slate-800 border-l border-slate-700 z-10"
                    >
                        <div className="p-4 border-b border-slate-700">
                            <h3 className="text-white font-medium">Chat</h3>
                        </div>
                        <div className="flex-1 p-4">
                            <p className="text-slate-400 text-sm text-center">
                                No messages yet. Start the conversation!
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
