'use client';

import { useRef, useEffect, useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    excellent: { label: 'Excellent', color: 'bg-green-500', icon: Wifi },
    good: { label: 'Good', color: 'bg-green-400', icon: Wifi },
    fair: { label: 'Fair', color: 'bg-yellow-400', icon: Wifi },
    poor: { label: 'Poor', color: 'bg-red-400', icon: WifiOff },
};

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
            const room = roomUrl || appointmentId; // use appointmentId as the room key
            joinCall(room, appointmentId, role);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                        'w-2.5 h-2.5 rounded-full animate-pulse',
                        callStatus === 'connected' ? 'bg-green-400' :
                            callStatus === 'connecting' ? 'bg-yellow-400' :
                                callStatus === 'reconnecting' ? 'bg-orange-400' :
                                    'bg-red-400',
                    )} />

                    <Badge variant="secondary" className="bg-black/40 text-white border-0 text-xs gap-1.5">
                        <Clock className="h-3 w-3" />
                        {formattedDuration}
                    </Badge>

                    {callStatus === 'connected' && (
                        <Badge variant="secondary" className={cn('border-0 text-xs gap-1 text-white', quality.color + '/20')}>
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

            {/* ── Remote Video (main area) ────────────────────────────── */}
            <div className="flex-1 relative">
                {remoteStream ? (
                    <video
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/90">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={patientAvatar} />
                            <AvatarFallback className="bg-slate-700 text-slate-300 text-3xl">
                                {patientName.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <p className="text-white font-medium text-lg mb-1">{patientName}</p>
                        <p className="text-slate-400 text-sm animate-pulse">
                            {callStatus === 'connecting'
                                ? 'Waiting for peer to join...'
                                : callStatus === 'reconnecting'
                                    ? 'Reconnecting...'
                                    : callStatus === 'error'
                                        ? 'Connection failed'
                                        : 'Connecting...'}
                        </p>
                    </div>
                )}
            </div>

            {/* ── Local Video (PiP) ───────────────────────────────────── */}
            <div className={cn(
                'absolute z-10 rounded-xl overflow-hidden shadow-lg border-2 border-slate-700/50 transition-all duration-300',
                isFullscreen ? 'bottom-24 right-6 w-64 h-48' : 'bottom-20 right-4 w-48 h-36',
            )}>
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
            </div>

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
