'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useVideoCall } from '@/hooks/useVideoCall';
import { VideoControls } from './VideoControls';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
    Wifi,
    WifiOff,
    Clock,
    Maximize,
    Minimize,
    MonitorUp,
    LayoutGrid,
    Layout,
    AlertTriangle,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import type { WebRTCRole } from '@/lib/webrtc/webrtcService';

// ── Props ──────────────────────────────────────────────────────────────────

interface VideoRoomProps {
    appointmentId: string;
    roomUrl?: string;
    patientName?: string;
    patientAvatar?: string;
    onCallEnd?: () => void;
    /** 'caller' for the doctor (creates the room), 'answerer' for the patient */
    role?: WebRTCRole;
}

// ── Quality badge helpers ──────────────────────────────────────────────────

const qualityConfig = {
    excellent: { label: 'Excellent', color: 'text-green-400', bg: 'bg-green-500/20', icon: Wifi, bars: 4 },
    good: { label: 'Good', color: 'text-green-300', bg: 'bg-green-500/15', icon: Wifi, bars: 3 },
    fair: { label: 'Fair', color: 'text-yellow-300', bg: 'bg-yellow-500/20', icon: Wifi, bars: 2 },
    poor: { label: 'Poor', color: 'text-red-400', bg: 'bg-red-500/20', icon: WifiOff, bars: 1 },
};

type LayoutMode = 'spotlight' | 'side-by-side';

// ── Component ──────────────────────────────────────────────────────────────

export function VideoRoom({
    appointmentId,
    roomUrl,
    patientName = 'Participant',
    patientAvatar,
    onCallEnd,
    role = 'caller',
}: VideoRoomProps) {
    const {
        callStatus,
        isMuted,
        isVideoOff,
        isScreenSharing,
        isChatOpen,
        localStream,
        remoteStream,
        connectionQuality,
        formattedDuration,
        joinCall,
        leaveCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        toggleChat,
    } = useVideoCall();

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [layoutMode, setLayoutMode] = useState<LayoutMode>('spotlight');
    const [reconnectCountdown, setReconnectCountdown] = useState(0);
    const [pipPosition, setPipPosition] = useState({ x: 0, y: 0 }); // for draggable PiP
    const [isDragging, setIsDragging] = useState(false);

    // ── Attach local stream to <video> ─────────────────────────────────────

    useEffect(() => {
        if (localVideoRef.current && localStream) {
            localVideoRef.current.srcObject = localStream;
        }
    }, [localStream]);

    // ── Attach remote stream to <video> ────────────────────────────────────

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    // ── Auto-join on mount ─────────────────────────────────────────────────

    useEffect(() => {
        if (callStatus === 'idle') {
            const room = roomUrl || appointmentId;
            joinCall(room, appointmentId, role);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Reconnection countdown ─────────────────────────────────────────────

    useEffect(() => {
        if (callStatus === 'reconnecting') {
            setReconnectCountdown(10);
            const interval = setInterval(() => {
                setReconnectCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        } else {
            setReconnectCountdown(0);
        }
    }, [callStatus]);

    // ── Fullscreen toggle ──────────────────────────────────────────────────

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // ── End call ───────────────────────────────────────────────────────────

    const handleEndCall = async () => {
        await leaveCall();
        onCallEnd?.();
    };

    // ── Layout toggle ──────────────────────────────────────────────────────

    const toggleLayout = useCallback(() => {
        setLayoutMode(prev => prev === 'spotlight' ? 'side-by-side' : 'spotlight');
    }, []);

    // ── Quality badge ──────────────────────────────────────────────────────

    const quality = qualityConfig[connectionQuality] || qualityConfig.good;
    const QualityIcon = quality.icon;

    // ── Render ─────────────────────────────────────────────────────────────

    return (
        <div
            ref={containerRef}
            className={cn(
                'relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col',
                isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'aspect-video max-h-[75vh]',
            )}
        >
            {/* ── Top Bar ─────────────────────────────────────────────── */}
            <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* Call status indicator */}
                    <div className={cn(
                        'w-2.5 h-2.5 rounded-full',
                        callStatus === 'connected' ? 'bg-green-400 animate-pulse' :
                            callStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                                callStatus === 'reconnecting' ? 'bg-orange-400 animate-pulse' :
                                    'bg-red-400',
                    )} />

                    <Badge variant="secondary" className="bg-black/40 text-white border-0 text-xs gap-1.5">
                        <Clock className="h-3 w-3" />
                        {formattedDuration}
                    </Badge>

                    {callStatus === 'connected' && (
                        <Badge variant="secondary" className={cn('border-0 text-xs gap-1', quality.bg, quality.color)}>
                            <QualityIcon className="h-3 w-3" />
                            {quality.label}
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {isScreenSharing && (
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-0 text-xs gap-1">
                            <MonitorUp className="h-3 w-3" />
                            Sharing
                        </Badge>
                    )}

                    {/* Layout Toggle */}
                    {remoteStream && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleLayout}
                            className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
                            title={layoutMode === 'spotlight' ? 'Side-by-side' : 'Spotlight'}
                        >
                            {layoutMode === 'spotlight'
                                ? <LayoutGrid className="h-4 w-4" />
                                : <Layout className="h-4 w-4" />
                            }
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="text-white/70 hover:text-white hover:bg-white/10 h-8 w-8"
                    >
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* ── Reconnection Banner ──────────────────────────────────── */}
            <AnimatePresence>
                {callStatus === 'reconnecting' && (
                    <motion.div
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-orange-600/90 backdrop-blur-md text-white px-4 py-2 rounded-lg flex items-center gap-3 shadow-lg"
                    >
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span className="text-sm font-medium">Connection lost. Reconnecting{reconnectCountdown > 0 ? ` (${reconnectCountdown}s)` : ''}...</span>
                    </motion.div>
                )}
                {callStatus === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, y: -40 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -40 }}
                        className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-red-600/90 backdrop-blur-md text-white px-4 py-2 rounded-lg flex items-center gap-3 shadow-lg"
                    >
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">Connection failed</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Video Area (Spotlight or Side-by-Side) ────────────────── */}
            <div className={cn(
                "flex-1 relative",
                layoutMode === 'side-by-side' && remoteStream ? "flex gap-2 p-2" : ""
            )}>
                {/* Remote Video */}
                {layoutMode === 'side-by-side' && remoteStream ? (
                    // Side-by-side: both videos in equal panes
                    <>
                        <div className="flex-1 relative rounded-xl overflow-hidden bg-slate-800">
                            <video
                                ref={remoteVideoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                            {/* Remote name tag */}
                            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                                <span className="text-white text-xs font-medium">{patientName}</span>
                            </div>
                        </div>

                        <div className="flex-1 relative rounded-xl overflow-hidden bg-slate-800">
                            {localStream && !isVideoOff ? (
                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                    style={{ transform: 'scaleX(-1)' }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                    <Avatar className="h-16 w-16">
                                        <AvatarFallback className="bg-slate-700 text-slate-400 text-xl">
                                            You
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                            )}
                            {/* Local name tag */}
                            <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                                <span className="text-white text-xs font-medium">You</span>
                            </div>
                            {isMuted && (
                                <div className="absolute bottom-3 right-3 bg-red-500/80 rounded-full px-2 py-0.5">
                                    <span className="text-[10px] text-white font-medium">Muted</span>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // Spotlight mode: remote full, local PiP
                    <>
                        {remoteStream ? (
                            <div className="relative w-full h-full">
                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                                {/* Remote participant name */}
                                <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                                    <span className="text-white text-sm font-medium">{patientName}</span>
                                </div>

                                {/* Network quality signal bars overlay */}
                                {callStatus === 'connected' && (
                                    <div className="absolute top-4 right-4 z-10 flex items-end gap-0.5 px-2 py-1.5 bg-black/40 backdrop-blur-sm rounded-lg">
                                        {[1, 2, 3, 4].map(i => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "w-1 rounded-full transition-colors",
                                                    i <= quality.bars ? "bg-green-400" : "bg-slate-600"
                                                )}
                                                style={{ height: `${8 + i * 3}px` }}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                <Avatar className="h-24 w-24 mb-4 ring-4 ring-slate-700/50">
                                    <AvatarImage src={patientAvatar} />
                                    <AvatarFallback className="bg-slate-700 text-slate-300 text-3xl">
                                        {patientName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <p className="text-white font-medium text-lg mb-1">{patientName}</p>
                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                    {callStatus === 'connecting' ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Waiting for peer to join...</span>
                                        </>
                                    ) : callStatus === 'reconnecting' ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            <span>Reconnecting...</span>
                                        </>
                                    ) : callStatus === 'error' ? (
                                        <>
                                            <AlertTriangle className="h-4 w-4 text-red-400" />
                                            <span className="text-red-400">Connection failed</span>
                                        </>
                                    ) : (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            <span>Connecting...</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── Local Video (PiP) — only in spotlight mode ────────────── */}
            {layoutMode === 'spotlight' && (
                <motion.div
                    drag
                    dragMomentum={false}
                    dragConstraints={containerRef}
                    onDragStart={() => setIsDragging(true)}
                    onDragEnd={() => setIsDragging(false)}
                    className={cn(
                        'absolute z-10 rounded-xl overflow-hidden shadow-lg border-2 transition-all duration-300 cursor-grab active:cursor-grabbing',
                        isDragging ? 'border-teal-400 shadow-teal-500/20' : 'border-slate-700/50',
                        isFullscreen ? 'w-64 h-48' : 'w-48 h-36',
                    )}
                    style={{
                        bottom: isFullscreen ? 96 : 80,
                        right: isFullscreen ? 24 : 16,
                    }}
                >
                    {localStream && !isVideoOff ? (
                        <video
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover mirror"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-slate-700 text-slate-400">
                                    You
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    )}

                    {/* Mute indicator on PiP */}
                    {isMuted && (
                        <div className="absolute bottom-2 left-2 bg-red-500/80 rounded-full px-2 py-0.5">
                            <span className="text-[10px] text-white font-medium">Muted</span>
                        </div>
                    )}

                    {/* Name tag on PiP */}
                    <div className="absolute bottom-2 right-2 bg-black/50 backdrop-blur-sm rounded px-1.5 py-0.5">
                        <span className="text-[10px] text-white">You</span>
                    </div>
                </motion.div>
            )}

            {/* ── Controls Bar ────────────────────────────────────────── */}
            <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/70 to-transparent p-4">
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
            </div>
        </div>
    );
}
