import { useCallback, useEffect, useRef } from 'react';
import { useVideoStore, selectIsInCall, selectFormattedDuration } from '@/stores/videoStore';
import { useNotificationStore } from '@/stores/notificationStore';
import { toast } from 'sonner';

/**
 * Custom hook for video call management
 * Abstracts the video SDK layer (Daily.co / LiveKit / etc.)
 */
export function useVideoCall() {
    const store = useVideoStore();
    const addNotification = useNotificationStore((s) => s.addNotification);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Selectors
    const isInCall = useVideoStore(selectIsInCall);
    const formattedDuration = useVideoStore(selectFormattedDuration);

    // Device enumeration
    const enumerateDevices = useCallback(async () => {
        try {
            // Request permissions first
            await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

            const devices = await navigator.mediaDevices.enumerateDevices();

            const audioInputs = devices.filter((d) => d.kind === 'audioinput');
            const audioOutputs = devices.filter((d) => d.kind === 'audiooutput');
            const videoInputs = devices.filter((d) => d.kind === 'videoinput');

            store.setDevices({
                audioInputs,
                audioOutputs,
                videoInputs,
                selectedAudioInput: audioInputs[0]?.deviceId || null,
                selectedAudioOutput: audioOutputs[0]?.deviceId || null,
                selectedVideoInput: videoInputs[0]?.deviceId || null,
            });

            return true;
        } catch (error) {
            console.error('Failed to enumerate devices:', error);
            toast.error('Camera/Microphone access denied');
            return false;
        }
    }, [store]);

    // Start pre-call device check
    const startDeviceCheck = useCallback(async () => {
        store.setCallStatus('checking_devices');
        const success = await enumerateDevices();
        if (success) {
            store.completeDeviceCheck();
        } else {
            store.setCallStatus('error');
        }
    }, [store, enumerateDevices]);

    // Join a call
    const joinCall = useCallback(async (roomUrl: string, appointmentId: string) => {
        store.joinCall(roomUrl, appointmentId);

        try {
            // Here you would initialize the actual video SDK
            // Example with Daily.co:
            // const callFrame = DailyIframe.createFrame();
            // await callFrame.join({ url: roomUrl });

            // Simulate connection delay
            await new Promise((resolve) => setTimeout(resolve, 1500));

            store.setCallStatus('connected');
            store.startTimer();

            // Start timer
            timerRef.current = setInterval(() => {
                store.incrementDuration();
            }, 1000);

            toast.success('Connected to call');

            addNotification({
                type: 'video_call',
                title: 'Call Started',
                message: 'Video consultation in progress',
            });
        } catch (error) {
            console.error('Failed to join call:', error);
            store.setCallStatus('error');
            toast.error('Failed to connect to call');
        }
    }, [store, addNotification]);

    // Leave call
    const leaveCall = useCallback(() => {
        // Clean up timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Here you would destroy the video SDK instance
        // callFrame.destroy();

        store.leaveCall();
        toast.info('Call ended');

        addNotification({
            type: 'video_call',
            title: 'Call Ended',
            message: `Duration: ${formattedDuration}`,
        });
    }, [store, addNotification, formattedDuration]);

    // Toggle mute with keyboard shortcut support
    const toggleMute = useCallback(() => {
        store.toggleMute();
        toast.info(store.isMuted ? 'Unmuted' : 'Muted', { duration: 1000 });
    }, [store]);

    // Toggle video
    const toggleVideo = useCallback(() => {
        store.toggleVideo();
        toast.info(store.isVideoOff ? 'Camera On' : 'Camera Off', { duration: 1000 });
    }, [store]);

    // Toggle screen share
    const toggleScreenShare = useCallback(async () => {
        if (!store.isScreenSharing) {
            try {
                // Request screen share
                await navigator.mediaDevices.getDisplayMedia({ video: true });
                store.toggleScreenShare();
                toast.success('Screen sharing started');
            } catch (error) {
                toast.error('Screen share cancelled');
            }
        } else {
            store.toggleScreenShare();
            toast.info('Screen sharing stopped');
        }
    }, [store]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isInCall) return;

            // Only trigger if not typing in an input
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                return;
            }

            switch (e.key.toLowerCase()) {
                case 'm':
                    toggleMute();
                    break;
                case 'v':
                    toggleVideo();
                    break;
                case 's':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        toggleScreenShare();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isInCall, toggleMute, toggleVideo, toggleScreenShare]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    return {
        // State
        callStatus: store.callStatus,
        isInCall,
        participants: store.participants,
        localParticipant: store.localParticipant,

        // Controls State
        isMuted: store.isMuted,
        isVideoOff: store.isVideoOff,
        isScreenSharing: store.isScreenSharing,

        // Devices
        devices: store.devices,
        isDeviceCheckComplete: store.isDeviceCheckComplete,

        // UI State
        isChatOpen: store.isChatOpen,
        isSettingsOpen: store.isSettingsOpen,

        // Timer
        duration: store.duration,
        formattedDuration,

        // Actions
        startDeviceCheck,
        joinCall,
        leaveCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
        selectDevice: store.selectDevice,

        // UI Actions
        toggleChat: store.toggleChat,
        toggleSettings: store.toggleSettings,
        togglePip: store.togglePip,
    };
}
