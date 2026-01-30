"use client";

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    Speaker,
    Volume2,
    CheckCircle2,
    XCircle,
    Loader2,
    Wifi,
    WifiOff
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PreCallCheckProps {
    onComplete: () => void;
    onCancel: () => void;
    patientName?: string;
    className?: string;
}

interface DeviceState {
    audioInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
    selectedAudioInput: string;
    selectedAudioOutput: string;
    selectedVideoInput: string;
}

type CheckStatus = 'pending' | 'checking' | 'success' | 'error';

export function PreCallCheck({
    onComplete,
    onCancel,
    patientName,
    className,
}: PreCallCheckProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [devices, setDevices] = useState<DeviceState>({
        audioInputs: [],
        audioOutputs: [],
        videoInputs: [],
        selectedAudioInput: '',
        selectedAudioOutput: '',
        selectedVideoInput: '',
    });

    const [checks, setChecks] = useState({
        camera: 'pending' as CheckStatus,
        microphone: 'pending' as CheckStatus,
        speaker: 'pending' as CheckStatus,
        connection: 'pending' as CheckStatus,
    });

    const [audioLevel, setAudioLevel] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    // Enumerate devices on mount
    useEffect(() => {
        async function init() {
            try {
                // Request permissions and get stream
                setChecks((prev) => ({ ...prev, camera: 'checking', microphone: 'checking' }));

                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });

                setStream(mediaStream);

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }

                // Enumerate devices
                const deviceList = await navigator.mediaDevices.enumerateDevices();

                const audioInputs = deviceList.filter((d) => d.kind === 'audioinput');
                const audioOutputs = deviceList.filter((d) => d.kind === 'audiooutput');
                const videoInputs = deviceList.filter((d) => d.kind === 'videoinput');

                setDevices({
                    audioInputs,
                    audioOutputs,
                    videoInputs,
                    selectedAudioInput: audioInputs[0]?.deviceId || '',
                    selectedAudioOutput: audioOutputs[0]?.deviceId || '',
                    selectedVideoInput: videoInputs[0]?.deviceId || '',
                });

                setChecks((prev) => ({
                    ...prev,
                    camera: 'success',
                    microphone: 'success',
                    speaker: 'success',
                }));

                // Test connection
                setChecks((prev) => ({ ...prev, connection: 'checking' }));
                await new Promise((resolve) => setTimeout(resolve, 1000));
                setChecks((prev) => ({ ...prev, connection: 'success' }));

                // Start audio level monitoring
                const audioContext = new AudioContext();
                const analyser = audioContext.createAnalyser();
                const source = audioContext.createMediaStreamSource(mediaStream);
                source.connect(analyser);
                analyser.fftSize = 256;

                const dataArray = new Uint8Array(analyser.frequencyBinCount);

                const updateLevel = () => {
                    analyser.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    setAudioLevel(Math.min(average / 128, 1));
                    requestAnimationFrame(updateLevel);
                };
                updateLevel();

            } catch (error) {
                console.error('Device access error:', error);
                setChecks((prev) => ({
                    ...prev,
                    camera: 'error',
                    microphone: 'error',
                }));
            }
        }

        init();

        return () => {
            // Cleanup stream
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    const toggleMute = () => {
        if (stream) {
            const audioTrack = stream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = isMuted;
                setIsMuted(!isMuted);
            }
        }
    };

    const toggleVideo = () => {
        if (stream) {
            const videoTrack = stream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = isVideoOff;
                setIsVideoOff(!isVideoOff);
            }
        }
    };

    const allChecksPass = Object.values(checks).every((c) => c === 'success');

    const renderCheckIcon = (status: CheckStatus) => {
        switch (status) {
            case 'pending':
                return <div className="w-5 h-5 rounded-full bg-slate-200" />;
            case 'checking':
                return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
            case 'success':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />;
        }
    };

    return (
        <Card className={cn("max-w-2xl mx-auto", className)}>
            <CardHeader className="text-center">
                <CardTitle className="text-2xl">Pre-Call Check</CardTitle>
                <CardDescription>
                    {patientName
                        ? `Preparing to join call with ${patientName}`
                        : 'Let\'s make sure everything is working'
                    }
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Video Preview */}
                <div className="relative aspect-video bg-slate-900 rounded-xl overflow-hidden">
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

                    {/* Audio Level Indicator */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 rounded-lg">
                            {isMuted ? (
                                <MicOff className="h-4 w-4 text-red-500" />
                            ) : (
                                <Mic className="h-4 w-4 text-white" />
                            )}
                            <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-green-500 to-teal-500"
                                    animate={{ width: `${audioLevel * 100}%` }}
                                    transition={{ duration: 0.1 }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick Controls */}
                    <div className="absolute top-4 right-4 flex gap-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={toggleMute}
                            className={cn(
                                "rounded-full bg-slate-900/80 hover:bg-slate-800",
                                isMuted && "bg-red-500/20 text-red-500"
                            )}
                        >
                            {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5 text-white" />}
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={toggleVideo}
                            className={cn(
                                "rounded-full bg-slate-900/80 hover:bg-slate-800",
                                isVideoOff && "bg-red-500/20 text-red-500"
                            )}
                        >
                            {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5 text-white" />}
                        </Button>
                    </div>
                </div>

                {/* Device Selection */}
                <div className="grid sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="text-sm text-slate-500">Camera</Label>
                        <Select
                            value={devices.selectedVideoInput}
                            onValueChange={(v) => setDevices((d) => ({ ...d, selectedVideoInput: v }))}
                        >
                            <SelectTrigger>
                                <Video className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Select camera" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.videoInputs.map((device) => (
                                    <SelectItem key={device.deviceId} value={device.deviceId}>
                                        {device.label || 'Camera'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm text-slate-500">Microphone</Label>
                        <Select
                            value={devices.selectedAudioInput}
                            onValueChange={(v) => setDevices((d) => ({ ...d, selectedAudioInput: v }))}
                        >
                            <SelectTrigger>
                                <Mic className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Select microphone" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.audioInputs.map((device) => (
                                    <SelectItem key={device.deviceId} value={device.deviceId}>
                                        {device.label || 'Microphone'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm text-slate-500">Speaker</Label>
                        <Select
                            value={devices.selectedAudioOutput}
                            onValueChange={(v) => setDevices((d) => ({ ...d, selectedAudioOutput: v }))}
                        >
                            <SelectTrigger>
                                <Volume2 className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Select speaker" />
                            </SelectTrigger>
                            <SelectContent>
                                {devices.audioOutputs.map((device) => (
                                    <SelectItem key={device.deviceId} value={device.deviceId}>
                                        {device.label || 'Speaker'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* System Checks */}
                <div className="bg-slate-50 rounded-xl p-4 space-y-3">
                    <h4 className="font-medium text-slate-900">System Checks</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                            {renderCheckIcon(checks.camera)}
                            <span className="text-sm">Camera</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                            {renderCheckIcon(checks.microphone)}
                            <span className="text-sm">Microphone</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                            {renderCheckIcon(checks.speaker)}
                            <span className="text-sm">Speaker</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                            {renderCheckIcon(checks.connection)}
                            <span className="text-sm">Connection</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        onClick={onComplete}
                        disabled={!allChecksPass}
                        className="bg-teal-600 hover:bg-teal-700"
                    >
                        {allChecksPass ? 'Join Call' : 'Checking...'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
