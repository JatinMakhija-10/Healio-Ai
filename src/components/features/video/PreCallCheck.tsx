"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Volume2,
    CheckCircle2,
    XCircle,
    Loader2,
    Wifi,
    WifiOff,
    RefreshCw,
    ShieldAlert,
    Clock,
    User,
    Sparkles,
    ArrowRight,
    Play,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoCall } from '@/hooks/useVideoCall';

interface PreCallCheckProps {
    onComplete: () => void;
    onCancel: () => void;
    remoteParticipantName?: string;
    userName?: string;
    appointmentTime?: string;
    appointmentDuration?: number;
    className?: string;
}

type CheckStatus = 'pending' | 'checking' | 'success' | 'error';

type NetworkQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';

const networkQualityConfig: Record<NetworkQuality, { label: string; color: string; barCount: number }> = {
    excellent: { label: 'Excellent', color: 'bg-green-500', barCount: 4 },
    good: { label: 'Good', color: 'bg-green-400', barCount: 3 },
    fair: { label: 'Fair', color: 'bg-yellow-400', barCount: 2 },
    poor: { label: 'Poor', color: 'bg-red-400', barCount: 1 },
    unknown: { label: 'Testing...', color: 'bg-slate-400', barCount: 0 },
};

export function PreCallCheck({
    onComplete,
    onCancel,
    remoteParticipantName,
    userName,
    appointmentTime,
    appointmentDuration,
    className,
}: PreCallCheckProps) {
    const {
        devices,
        enumerateDevices,
        selectDevice
    } = useVideoCall();

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null); // Fix: use ref for stream
    const audioContextRef = useRef<AudioContext | null>(null);
    const animationFrameRef = useRef<number>(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [networkQuality, setNetworkQuality] = useState<NetworkQuality>('unknown');
    const [speakerTesting, setSpeakerTesting] = useState(false);
    const [checkStep, setCheckStep] = useState(0); // 0-4 for animated progress

    const [checks, setChecks] = useState<{
        camera: CheckStatus;
        microphone: CheckStatus;
        speaker: CheckStatus;
        connection: CheckStatus;
    }>({
        camera: 'pending',
        microphone: 'pending',
        speaker: 'pending',
        connection: 'pending',
    });

    // --- Toggle handlers (bug fix: use functional update) ---
    const toggleMute = () => {
        setIsMuted(prev => {
            const newMuted = !prev;
            if (streamRef.current) {
                streamRef.current.getAudioTracks().forEach(t => t.enabled = !newMuted);
            }
            return newMuted;
        });
    };

    const toggleVideo = () => {
        setIsVideoOff(prev => {
            const newVideoOff = !prev;
            if (streamRef.current) {
                streamRef.current.getVideoTracks().forEach(t => t.enabled = !newVideoOff);
            }
            return newVideoOff;
        });
    };

    // --- Network Speed Test ---
    const testNetworkSpeed = useCallback(async (): Promise<NetworkQuality> => {
        try {
            const start = performance.now();
            // Ping a small, fast resource to measure RTT
            await fetch('https://www.google.com/favicon.ico', {
                mode: 'no-cors',
                cache: 'no-store',
            });
            const rtt = performance.now() - start;

            if (rtt < 100) return 'excellent';
            if (rtt < 200) return 'good';
            if (rtt < 400) return 'fair';
            return 'poor';
        } catch {
            return navigator.onLine ? 'fair' : 'poor';
        }
    }, []);

    // --- Speaker Test ---
    const testSpeaker = useCallback(async () => {
        setSpeakerTesting(true);
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4 note
            gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);

            oscillator.start(ctx.currentTime);
            oscillator.stop(ctx.currentTime + 0.8);

            await new Promise(resolve => setTimeout(resolve, 900));
            ctx.close();
        } catch (err) {
            console.warn('Speaker test failed:', err);
        } finally {
            setSpeakerTesting(false);
        }
    }, []);

    // --- Device Initialization ---
    const runChecks = useCallback(async () => {
        setChecks({
            camera: 'checking',
            microphone: 'checking',
            speaker: 'pending',
            connection: 'pending',
        });
        setCheckStep(1);
        setPermissionDenied(false);

        // Step 1: Enumerate devices
        const hasDevices = await enumerateDevices();
        if (!hasDevices) {
            setPermissionDenied(true);
            setChecks(c => ({ ...c, camera: 'error', microphone: 'error' }));
            return;
        }

        // Step 2: Get local preview stream
        try {
            const constraints: MediaStreamConstraints = {
                video: devices.selectedVideoInput ? { deviceId: { exact: devices.selectedVideoInput } } : true,
                audio: devices.selectedAudioInput ? { deviceId: { exact: devices.selectedAudioInput } } : true,
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Stop any previous stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }

            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }

            const hasVideo = mediaStream.getVideoTracks().length > 0;
            const hasAudio = mediaStream.getAudioTracks().length > 0;

            setChecks(c => ({
                ...c,
                camera: hasVideo ? 'success' : 'error',
                microphone: hasAudio ? 'success' : 'error',
            }));
            setCheckStep(2);

            // Step 3: Audio level visualization
            if (hasAudio) {
                try {
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    audioContextRef.current = audioContext;
                    const analyser = audioContext.createAnalyser();
                    const source = audioContext.createMediaStreamSource(mediaStream);
                    source.connect(analyser);
                    analyser.fftSize = 256;
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);

                    const updateLevel = () => {
                        analyser.getByteFrequencyData(dataArray);
                        let sum = 0;
                        for (let i = 0; i < bufferLength; i++) {
                            sum += dataArray[i];
                        }
                        const avg = sum / bufferLength;
                        setAudioLevel(avg / 255);
                        animationFrameRef.current = requestAnimationFrame(updateLevel);
                    };
                    updateLevel();
                } catch (err) {
                    console.warn('AudioContext failed:', err);
                }
            }

            // Step 4: Speaker check
            setChecks(c => ({ ...c, speaker: 'success' }));
            setCheckStep(3);

            // Step 5: Network test
            setChecks(c => ({ ...c, connection: 'checking' }));
            const quality = await testNetworkSpeed();
            setNetworkQuality(quality);
            setChecks(c => ({
                ...c,
                connection: quality === 'poor' ? 'error' : 'success',
            }));
            setCheckStep(4);

        } catch (err: any) {
            console.error('Preview failed:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setPermissionDenied(true);
            }
            setChecks(c => ({ ...c, camera: 'error', microphone: 'error' }));
        }
    }, [enumerateDevices, devices.selectedVideoInput, devices.selectedAudioInput, testNetworkSpeed]);

    useEffect(() => {
        runChecks();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Device Change Handlers ---
    const handleVideoChange = (deviceId: string) => {
        selectDevice('video', deviceId);
    };

    const handleAudioChange = (deviceId: string) => {
        selectDevice('audio', deviceId);
    };

    const handleSpeakerChange = (deviceId: string) => {
        selectDevice('speaker', deviceId);
    };

    // --- Computed ---
    const allChecksPass =
        checks.camera === 'success' &&
        checks.microphone === 'success' &&
        checks.connection === 'success';

    const progress = (checkStep / 4) * 100;

    const renderCheckIcon = (status: CheckStatus) => {
        switch (status) {
            case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
            case 'checking': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
            default: return <div className="h-5 w-5 rounded-full border-2 border-slate-300" />;
        }
    };

    const nq = networkQualityConfig[networkQuality];

    return (
        <Card className={cn("max-w-3xl mx-auto border-0 shadow-2xl bg-white/95 backdrop-blur", className)}>
            <CardHeader className="text-center pb-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
                        <Video className="h-5 w-5 text-white" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold">Pre-Call Check</CardTitle>
                <CardDescription>
                    {remoteParticipantName
                        ? `Getting ready to consult with ${remoteParticipantName}`
                        : 'Check your devices before joining the consultation'}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
                {/* Appointment Info Banner */}
                {(remoteParticipantName || appointmentTime) && (
                    <div className="flex items-center gap-4 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl border border-teal-100">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                            {remoteParticipantName?.charAt(0) || <User className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm truncate">
                                {remoteParticipantName || 'Consultation'}
                            </p>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                {appointmentTime && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {appointmentTime}
                                    </span>
                                )}
                                {appointmentDuration && (
                                    <span>{appointmentDuration} min</span>
                                )}
                            </div>
                        </div>
                        <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-[10px]">
                            Upcoming
                        </Badge>
                    </div>
                )}

                {/* Progress Bar */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Device check progress</span>
                        <span>{checkStep}/4 checks</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-teal-400 to-teal-600 rounded-full"
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                    </div>
                </div>

                {/* Preview Area */}
                <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-inner ring-1 ring-black/10">
                    {isVideoOff ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                            <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mb-3">
                                <VideoOff className="h-8 w-8 text-slate-500" />
                            </div>
                            <p className="text-slate-400 text-sm">Camera is off</p>
                        </div>
                    ) : (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                            style={{ transform: 'scaleX(-1)' }}
                        />
                    )}

                    {/* Name Tag */}
                    <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                        <span className="text-white text-sm font-medium">
                            {userName || 'You'}
                        </span>
                    </div>

                    {/* Audio Vis + Mute/Video Controls */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        <button
                            onClick={toggleMute}
                            className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                                isMuted
                                    ? "bg-red-500/80 text-white"
                                    : "bg-black/50 backdrop-blur-md text-white border border-white/10 hover:bg-white/20"
                            )}
                        >
                            {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={toggleVideo}
                            className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center transition-all",
                                isVideoOff
                                    ? "bg-red-500/80 text-white"
                                    : "bg-black/50 backdrop-blur-md text-white border border-white/10 hover:bg-white/20"
                            )}
                        >
                            {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
                        </button>
                    </div>

                    {/* Audio Level Bar (top right) */}
                    {!isMuted && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
                            <Mic className="h-3.5 w-3.5 text-white" />
                            <div className="w-16 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                                    animate={{ width: `${audioLevel * 100}%` }}
                                    transition={{ duration: 0.1 }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Permission Denied Alert */}
                <AnimatePresence>
                    {permissionDenied && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="p-4 bg-red-50 border border-red-200 rounded-xl"
                        >
                            <div className="flex items-start gap-3">
                                <ShieldAlert className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-red-800 text-sm">Camera/Microphone Access Denied</p>
                                    <p className="text-xs text-red-600 mt-1">
                                        Your browser blocked access to your camera or microphone. To fix this:
                                    </p>
                                    <ol className="text-xs text-red-600 mt-2 space-y-1 list-decimal list-inside">
                                        <li>Click the 🔒 lock icon in your browser&apos;s address bar</li>
                                        <li>Find Camera and Microphone permissions</li>
                                        <li>Set both to &quot;Allow&quot;</li>
                                        <li>Click the &quot;Re-check&quot; button below</li>
                                    </ol>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Device Selectors */}
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Video className="h-3 w-3" /> Camera
                        </Label>
                        <Select value={devices.selectedVideoInput || undefined} onValueChange={handleVideoChange}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select Camera" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.videoInputs.map((d) => (
                                    <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || 'Camera'}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Mic className="h-3 w-3" /> Microphone
                        </Label>
                        <Select value={devices.selectedAudioInput || undefined} onValueChange={handleAudioChange}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select Mic" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.audioInputs.map((d) => (
                                    <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || 'Microphone'}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Volume2 className="h-3 w-3" /> Speaker
                        </Label>
                        <div className="flex gap-1.5">
                            <Select value={devices.selectedAudioOutput || undefined} onValueChange={handleSpeakerChange}>
                                <SelectTrigger className="h-9 flex-1">
                                    <SelectValue placeholder="Select Speaker" />
                                </SelectTrigger>
                                <SelectContent>
                                    {devices.audioOutputs.map((d) => (
                                        <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || 'Speaker'}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={testSpeaker}
                                disabled={speakerTesting}
                                className="h-9 px-2.5 shrink-0"
                                title="Test speaker"
                            >
                                {speakerTesting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Status Checks + Network Quality */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                        { label: 'Camera', status: checks.camera },
                        { label: 'Microphone', status: checks.microphone },
                        { label: 'Speaker', status: checks.speaker },
                        { label: 'Internet', status: checks.connection },
                    ].map((item) => (
                        <div key={item.label} className={cn(
                            "flex items-center gap-2 p-2.5 rounded-lg border transition-colors",
                            item.status === 'success' ? "bg-green-50 border-green-100" :
                                item.status === 'error' ? "bg-red-50 border-red-100" :
                                    "bg-slate-50 border-slate-100"
                        )}>
                            {renderCheckIcon(item.status)}
                            <span className="text-xs font-medium text-slate-700">{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* Network Quality Bar */}
                {networkQuality !== 'unknown' && (
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <Wifi className={cn("h-4 w-4", networkQuality === 'poor' ? "text-red-500" : "text-green-500")} />
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-slate-700">Network Quality</span>
                                <span className={cn("text-xs font-semibold",
                                    networkQuality === 'excellent' ? "text-green-600" :
                                        networkQuality === 'good' ? "text-green-500" :
                                            networkQuality === 'fair' ? "text-yellow-600" : "text-red-500"
                                )}>
                                    {nq.label}
                                </span>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4].map(i => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-1.5 flex-1 rounded-full transition-colors",
                                            i <= nq.barCount ? nq.color : "bg-slate-200"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="flex justify-between items-center pt-2 border-t">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={onCancel} className="text-slate-500 hover:text-slate-900">
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={runChecks}
                            className="gap-1.5 text-slate-600"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Re-check
                        </Button>
                    </div>
                    <Button
                        onClick={onComplete}
                        disabled={!allChecksPass}
                        className={cn(
                            "min-w-[160px] font-semibold gap-2",
                            allChecksPass
                                ? "bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 shadow-lg shadow-teal-500/20"
                                : "bg-slate-200 text-slate-400"
                        )}
                    >
                        {allChecksPass ? (
                            <>
                                Join Consultation
                                <ArrowRight className="h-4 w-4" />
                            </>
                        ) : (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Checking...
                            </>
                        )}
                    </Button>
                </div>

                {/* Keyboard Hints */}
                {allChecksPass && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center"
                    >
                        <p className="text-[11px] text-slate-400">
                            Once in the call: <kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-500">M</kbd> mute · <kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-500">V</kbd> video · <kbd className="px-1 py-0.5 bg-slate-100 rounded text-slate-500">S</kbd> screen share
                        </p>
                    </motion.div>
                )}
            </CardContent>
        </Card>
    );
}
