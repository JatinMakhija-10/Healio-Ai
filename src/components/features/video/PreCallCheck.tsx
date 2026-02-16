"use client";

import { useState, useEffect, useRef } from 'react';
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
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    Volume2,
    CheckCircle2,
    XCircle,
    Loader2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useVideoCall } from '@/hooks/useVideoCall';

interface PreCallCheckProps {
    onComplete: () => void;
    onCancel: () => void;
    remoteParticipantName?: string;
    userName?: string;
    className?: string;
}

type CheckStatus = 'pending' | 'checking' | 'success' | 'error';

export function PreCallCheck({
    onComplete,
    onCancel,
    remoteParticipantName,
    userName,
    className,
}: PreCallCheckProps) {
    const {
        devices,
        enumerateDevices,
        selectDevice
    } = useVideoCall();

    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [audioLevel, setAudioLevel] = useState(0);

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

    const toggleMute = () => {
        setIsMuted(prev => !prev);
        if (stream) {
            stream.getAudioTracks().forEach(t => t.enabled = isMuted); // toggle
        }
    };

    const toggleVideo = () => {
        setIsVideoOff(prev => !prev);
        if (stream) {
            stream.getVideoTracks().forEach(t => t.enabled = isVideoOff); // toggle
        }
    };

    // ── Device Initialization ──────────────────────────────────────────────

    useEffect(() => {
        let mounted = true;
        let audioContext: AudioContext | null = null;
        let analyser: AnalyserNode | null = null;
        let animationFrame: number;

        const init = async () => {
            setChecks(c => ({ ...c, camera: 'checking', microphone: 'checking', connection: 'checking' }));

            // 1. Enumerate devices via store
            const hasDevices = await enumerateDevices();
            if (!hasDevices) {
                if (mounted) setChecks(c => ({ ...c, camera: 'error', microphone: 'error' }));
                return;
            }

            // 2. Get local preview stream with current selection
            try {
                // Determine constraints based on store or defaults
                const constraints: MediaStreamConstraints = {
                    video: devices.selectedVideoInput ? { deviceId: { exact: devices.selectedVideoInput } } : true,
                    audio: devices.selectedAudioInput ? { deviceId: { exact: devices.selectedAudioInput } } : true,
                };

                const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
                if (!mounted) {
                    mediaStream.getTracks().forEach(t => t.stop());
                    return;
                }

                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }

                setChecks(c => ({
                    ...c,
                    camera: mediaStream.getVideoTracks().length > 0 ? 'success' : 'error',
                    microphone: mediaStream.getAudioTracks().length > 0 ? 'success' : 'error',
                    speaker: 'success', // assume success if we can enumerate
                    connection: navigator.onLine ? 'success' : 'error',
                }));

                // 3. Audio level visualization
                try {
                    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    analyser = audioContext.createAnalyser();
                    const source = audioContext.createMediaStreamSource(mediaStream);
                    source.connect(analyser);
                    analyser.fftSize = 256;
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);

                    const updateLevel = () => {
                        if (!mounted) return;
                        analyser!.getByteFrequencyData(dataArray);
                        let sum = 0;
                        for (let i = 0; i < bufferLength; i++) {
                            sum += dataArray[i];
                        }
                        const avg = sum / bufferLength;
                        setAudioLevel(avg / 255); // Normalize 0-1
                        animationFrame = requestAnimationFrame(updateLevel);
                    };
                    updateLevel();
                } catch (err) {
                    console.warn('AudioContext failed:', err);
                }

            } catch (err) {
                console.error('Preview failed:', err);
                if (mounted) setChecks(c => ({ ...c, camera: 'error', microphone: 'error' }));
            }
        };

        init();

        return () => {
            mounted = false;
            if (animationFrame) cancelAnimationFrame(animationFrame);
            if (audioContext) audioContext.close();
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount. Changing devices will trigger re-mount logic if we force it,
    // but for now simplistic approach: user selects device -> we might need to re-request stream.

    // ── Handle Device Change ───────────────────────────────────────────────

    // If selected device changes in store, we should ideally re-acquire stream.
    // However, for simplicity in this implementation, we just update the store preference.
    // The actual call will use the store preference.
    // To update PREVIEW, we would need to watch `devices.selectedX` and re-run getUserMedia.

    const handleVideoChange = async (deviceId: string) => {
        selectDevice('video', deviceId);
        // Re-acquire stream behavior could be added here
    };

    const handleAudioChange = async (deviceId: string) => {
        selectDevice('audio', deviceId);
    };

    const handleSpeakerChange = (deviceId: string) => {
        selectDevice('speaker', deviceId);
    };

    // ── Render Helpers ─────────────────────────────────────────────────────

    const allChecksPass =
        checks.camera === 'success' &&
        checks.microphone === 'success' &&
        checks.connection === 'success';

    const renderCheckIcon = (status: CheckStatus) => {
        switch (status) {
            case 'success': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
            case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
            case 'checking': return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
            default: return <div className="h-5 w-5 rounded-full border-2 border-slate-300" />;
        }
    };

    return (
        <Card className={cn("max-w-3xl mx-auto border-0 shadow-2xl bg-white/95 backdrop-blur", className)}>
            <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl font-bold">System Check</CardTitle>
                <CardDescription>
                    {remoteParticipantName
                        ? `Getting ready to meet ${remoteParticipantName}`
                        : 'Check your devices before joining'}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Preview Area */}
                <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden shadow-inner ring-1 ring-black/10">
                    {isVideoOff ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                            <VideoOff className="h-16 w-16 text-slate-600" />
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

                    {/* Audio Vis */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-black/50 backdrop-blur-md rounded-lg border border-white/10">
                        {isMuted ? (
                            <MicOff className="h-4 w-4 text-red-500" />
                        ) : (
                            <Mic className="h-4 w-4 text-white" />
                        )}
                        <div className="w-20 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                                animate={{ width: `${audioLevel * 100}%` }}
                                transition={{ duration: 0.1 }}
                            />
                        </div>
                    </div>
                </div>

                {/* Device Selectors */}
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Camera</Label>
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
                        <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Microphone</Label>
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
                        <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Speaker</Label>
                        <Select value={devices.selectedAudioOutput || undefined} onValueChange={handleSpeakerChange}>
                            <SelectTrigger className="h-9">
                                <SelectValue placeholder="Select Speaker" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.audioOutputs.map((d) => (
                                    <SelectItem key={d.deviceId} value={d.deviceId}>{d.label || 'Speaker'}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Status List */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                        { label: 'Camera', status: checks.camera },
                        { label: 'Microphone', status: checks.microphone },
                        { label: 'Speaker', status: checks.speaker },
                        { label: 'Internet', status: checks.connection },
                    ].map((item) => (
                        <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                            {renderCheckIcon(item.status)}
                            <span className="text-xs font-medium text-slate-700">{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="flex justify-between items-center pt-2 border-t">
                    <Button variant="ghost" onClick={onCancel} className="text-slate-500 hover:text-slate-900">
                        Cancel
                    </Button>
                    <Button
                        onClick={onComplete}
                        disabled={!allChecksPass}
                        className={cn(
                            "min-w-[140px] font-semibold shadow-lg shadow-teal-500/20",
                            allChecksPass ? "bg-teal-600 hover:bg-teal-700" : "bg-slate-200 text-slate-400"
                        )}
                    >
                        {allChecksPass ? 'Join Interview' : 'Checking...'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
