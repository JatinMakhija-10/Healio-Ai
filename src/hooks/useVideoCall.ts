'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useVideoStore, selectFormattedDuration } from '@/stores/videoStore';
import { WebRTCService, WebRTCRole } from '@/lib/webrtc/webrtcService';
import { useNotificationStore } from '@/stores/notificationStore';
import type { ConnectionQuality } from '@/stores/videoStore';

/**
 * Custom hook that manages the full video-call lifecycle,
 * wiring WebRTCService ↔ videoStore ↔ UI components.
 */
export function useVideoCall() {
    const store = useVideoStore();
    const addNotification = useNotificationStore((s) => s.addNotification);
    const formattedDuration = useVideoStore(selectFormattedDuration);

    // Refs survive re-renders and keep mutable state
    const webrtcRef = useRef<WebRTCService | null>(null);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const statsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const screenStreamRef = useRef<MediaStream | null>(null);
    const originalVideoTrackRef = useRef<MediaStreamTrack | null>(null);

    // ── Device Enumeration ─────────────────────────────────────────────────

    const enumerateDevices = useCallback(async () => {
        try {
            // Request a temporary stream so the browser grants device-label access
            const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            const allDevices = await navigator.mediaDevices.enumerateDevices();

            store.setDevices({
                audioInputs: allDevices.filter(d => d.kind === 'audioinput'),
                audioOutputs: allDevices.filter(d => d.kind === 'audiooutput'),
                videoInputs: allDevices.filter(d => d.kind === 'videoinput'),
            });

            // Auto-select defaults
            const audioIn = allDevices.find(d => d.kind === 'audioinput');
            const videoIn = allDevices.find(d => d.kind === 'videoinput');
            if (audioIn) store.selectDevice('audio', audioIn.deviceId);
            if (videoIn) store.selectDevice('video', videoIn.deviceId);

            // Stop temporary stream (real stream acquired later in joinCall)
            tempStream.getTracks().forEach(t => t.stop());
            return true;
        } catch (err) {
            console.error('[VideoCall] Device enumeration failed:', err);
            addNotification({
                type: 'system',
                title: 'Device Error',
                message: 'Could not access camera or microphone. Please check permissions.',
            });
            return false;
        }
    }, [store, addNotification]);

    const startDeviceCheck = useCallback(async () => {
        store.setCallStatus('checking_devices');
        const success = await enumerateDevices();
        if (success) {
            store.completeDeviceCheck();
        } else {
            store.setCallStatus('error');
        }
    }, [store, enumerateDevices]);

    // ── Join Call ───────────────────────────────────────────────────────────

    const joinCall = useCallback(async (
        roomId: string,
        appointmentId: string,
        role: WebRTCRole = 'caller',
    ) => {
        store.joinCall(roomId, appointmentId);    // status → 'connecting'

        try {
            // 1. Get local media with the selected devices
            const constraints: MediaStreamConstraints = {
                audio: store.devices.selectedAudioInput
                    ? { deviceId: { exact: store.devices.selectedAudioInput } }
                    : true,
                video: store.devices.selectedVideoInput
                    ? { deviceId: { exact: store.devices.selectedVideoInput } }
                    : true,
            };

            const localStream = await navigator.mediaDevices.getUserMedia(constraints);
            store.setLocalStream(localStream);

            // Save the original video track so we can restore after screen-share
            originalVideoTrackRef.current = localStream.getVideoTracks()[0] ?? null;

            // 2. Unique peer ID for signaling (use the user-session id or a random)
            const peerId = `peer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

            // 3. Create the WebRTC service
            const webrtc = new WebRTCService(roomId, peerId, role, {
                onRemoteStream: (stream) => {
                    store.setRemoteStream(stream);
                    store.setCallStatus('connected');
                    store.startTimer();

                    addNotification({
                        type: 'video_call',
                        title: 'Connected',
                        message: 'Video call is now connected.',
                    });
                },
                onConnectionStateChange: (state) => {
                    switch (state) {
                        case 'connected':
                            store.setCallStatus('connected');
                            break;
                        case 'disconnected':
                        case 'failed':
                            store.setCallStatus('reconnecting');
                            addNotification({
                                type: 'video_call',
                                title: 'Connection Issue',
                                message: 'Attempting to reconnect...',
                            });
                            break;
                        case 'closed':
                            store.setCallStatus('ended');
                            break;
                    }
                },
                onIceConnectionStateChange: (state) => {
                    if (state === 'connected' || state === 'completed') {
                        store.setCallStatus('connected');
                    } else if (state === 'disconnected') {
                        store.setCallStatus('reconnecting');
                    }
                },
                onError: (err) => {
                    console.error('[VideoCall] WebRTC error:', err);
                    addNotification({
                        type: 'system',
                        title: 'Call Error',
                        message: err.message || 'An error occurred during the call.',
                    });
                },
            });

            webrtcRef.current = webrtc;
            await webrtc.start(localStream);

            // If we are the caller, wait briefly then show "waiting for peer"
            if (role === 'caller') {
                store.setCallStatus('connecting');
            }

            // 4. Start connection quality monitoring
            statsIntervalRef.current = setInterval(async () => {
                const stats = await webrtc.getStats();
                if (stats) {
                    let quality: ConnectionQuality = 'excellent';
                    if (stats.rtt > 0.3 || stats.packetsLost > 50) quality = 'poor';
                    else if (stats.rtt > 0.15 || stats.packetsLost > 20) quality = 'fair';
                    else if (stats.rtt > 0.05 || stats.packetsLost > 5) quality = 'good';
                    store.setConnectionQuality(quality);
                }
            }, 3000);

        } catch (err) {
            console.error('[VideoCall] Join call failed:', err);
            store.setCallStatus('error');
            addNotification({
                type: 'system',
                title: 'Failed to Join',
                message: 'Could not start the video call. Please check your camera/mic.',
            });
        }
    }, [store, addNotification]);

    // ── Leave Call ──────────────────────────────────────────────────────────

    const leaveCall = useCallback(async () => {
        // Stop the timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        // Stop quality monitoring
        if (statsIntervalRef.current) {
            clearInterval(statsIntervalRef.current);
            statsIntervalRef.current = null;
        }
        // Stop screen sharing if active
        if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
            screenStreamRef.current = null;
        }
        // Stop local stream tracks
        const localStream = store.localStream;
        if (localStream) {
            localStream.getTracks().forEach(t => t.stop());
        }
        // Hangup the WebRTC connection
        if (webrtcRef.current) {
            await webrtcRef.current.hangup();
            webrtcRef.current = null;
        }
        store.leaveCall();
    }, [store]);

    // ── Toggle Mute (real track toggle) ────────────────────────────────────

    const toggleMute = useCallback(() => {
        const newMuted = !store.isMuted;
        store.toggleMute();
        if (webrtcRef.current) {
            webrtcRef.current.setAudioEnabled(!newMuted);
        }
    }, [store]);

    // ── Toggle Video (real track toggle) ───────────────────────────────────

    const toggleVideo = useCallback(() => {
        const newVideoOff = !store.isVideoOff;
        store.toggleVideo();
        if (webrtcRef.current) {
            webrtcRef.current.setVideoEnabled(!newVideoOff);
        }
    }, [store]);

    // ── Toggle Screen Share ────────────────────────────────────────────────

    const toggleScreenShare = useCallback(async () => {
        if (!webrtcRef.current) return;

        if (store.isScreenSharing) {
            // Stop screen share, revert to camera
            if (screenStreamRef.current) {
                screenStreamRef.current.getTracks().forEach(t => t.stop());
                screenStreamRef.current = null;
            }
            if (originalVideoTrackRef.current) {
                await webrtcRef.current.replaceVideoTrack(originalVideoTrackRef.current);
            }
            store.toggleScreenShare();
        } else {
            // Start screen share
            try {
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: false,
                });
                screenStreamRef.current = screenStream;
                const screenTrack = screenStream.getVideoTracks()[0];

                // Listen for the user clicking "Stop Sharing" in the browser UI
                screenTrack.onended = () => {
                    if (originalVideoTrackRef.current && webrtcRef.current) {
                        webrtcRef.current.replaceVideoTrack(originalVideoTrackRef.current);
                    }
                    screenStreamRef.current = null;
                    if (store.isScreenSharing) store.toggleScreenShare();
                };

                await webrtcRef.current.replaceVideoTrack(screenTrack);
                store.toggleScreenShare();
            } catch (err) {
                console.error('[VideoCall] Screen share failed:', err);
                // User cancelled the picker — not an error
            }
        }
    }, [store]);

    // ── Toggle Chat ────────────────────────────────────────────────────────

    const toggleChat = useCallback(() => {
        store.toggleChat();
    }, [store]);

    // ── Timer Effect ───────────────────────────────────────────────────────

    useEffect(() => {
        if (store.callStatus === 'connected' && !timerRef.current) {
            timerRef.current = setInterval(() => {
                store.incrementDuration();
            }, 1000);
        }
        if (store.callStatus !== 'connected' && store.callStatus !== 'reconnecting') {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, [store.callStatus, store]);

    // ── Keyboard Shortcuts ─────────────────────────────────────────────────

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            // Skip if user is typing in an input
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
            if (store.callStatus !== 'connected') return;

            switch (e.key.toLowerCase()) {
                case 'm':
                    toggleMute();
                    break;
                case 'v':
                    toggleVideo();
                    break;
                case 's':
                    toggleScreenShare();
                    break;
            }
        };

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [store.callStatus, toggleMute, toggleVideo, toggleScreenShare]);

    // ── Cleanup on Unmount ─────────────────────────────────────────────────

    useEffect(() => {
        return () => {
            if (webrtcRef.current) {
                webrtcRef.current.hangup();
                webrtcRef.current = null;
            }
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
            if (statsIntervalRef.current) {
                clearInterval(statsIntervalRef.current);
            }
            const ls = useVideoStore.getState().localStream;
            if (ls) {
                ls.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    return {
        // State
        callStatus: store.callStatus,
        isMuted: store.isMuted,
        isVideoOff: store.isVideoOff,
        isScreenSharing: store.isScreenSharing,
        isChatOpen: store.isChatOpen,
        isPipActive: store.isPipActive,
        devices: store.devices,
        isDeviceCheckComplete: store.isDeviceCheckComplete,
        localStream: store.localStream,
        remoteStream: store.remoteStream,
        connectionQuality: store.connectionQuality,
        participants: store.participants,
        duration: store.duration,
        formattedDuration,

        // Actions
        startDeviceCheck,
        joinCall,
        leaveCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        toggleChat,
        togglePip: store.togglePip,
        enumerateDevices,
        selectDevice: store.selectDevice,
    };
}
