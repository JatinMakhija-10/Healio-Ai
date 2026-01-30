import { create } from 'zustand';

export type CallStatus =
    | 'idle'
    | 'checking_devices'
    | 'waiting_room'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'ended'
    | 'error';

export interface Participant {
    id: string;
    name: string;
    isLocal: boolean;
    isMuted: boolean;
    isVideoOff: boolean;
    isScreenSharing: boolean;
    connectionQuality: 'good' | 'fair' | 'poor';
}

export interface DeviceState {
    audioInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
    selectedAudioInput: string | null;
    selectedAudioOutput: string | null;
    selectedVideoInput: string | null;
}

interface VideoState {
    // Call State
    callStatus: CallStatus;
    roomUrl: string | null;
    appointmentId: string | null;

    // Participants
    participants: Participant[];
    localParticipant: Participant | null;

    // Controls
    isMuted: boolean;
    isVideoOff: boolean;
    isScreenSharing: boolean;
    isPipActive: boolean;

    // Devices
    devices: DeviceState;
    isDeviceCheckComplete: boolean;

    // UI State
    isChatOpen: boolean;
    isSettingsOpen: boolean;
    isWaitingRoomOpen: boolean;

    // Call Metadata
    startTime: Date | null;
    duration: number; // seconds

    // Actions
    setCallStatus: (status: CallStatus) => void;
    joinCall: (roomUrl: string, appointmentId: string) => void;
    leaveCall: () => void;

    // Control Actions
    toggleMute: () => void;
    toggleVideo: () => void;
    toggleScreenShare: () => void;
    togglePip: () => void;

    // Device Actions
    setDevices: (devices: Partial<DeviceState>) => void;
    selectDevice: (type: 'audio' | 'video' | 'speaker', deviceId: string) => void;
    completeDeviceCheck: () => void;

    // Participant Actions
    addParticipant: (participant: Participant) => void;
    removeParticipant: (id: string) => void;
    updateParticipant: (id: string, updates: Partial<Participant>) => void;

    // UI Actions
    toggleChat: () => void;
    toggleSettings: () => void;
    toggleWaitingRoom: () => void;

    // Timer
    startTimer: () => void;
    incrementDuration: () => void;
    resetTimer: () => void;
}

const initialDeviceState: DeviceState = {
    audioInputs: [],
    audioOutputs: [],
    videoInputs: [],
    selectedAudioInput: null,
    selectedAudioOutput: null,
    selectedVideoInput: null,
};

export const useVideoStore = create<VideoState>()((set, get) => ({
    // Initial State
    callStatus: 'idle',
    roomUrl: null,
    appointmentId: null,
    participants: [],
    localParticipant: null,
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
    isPipActive: false,
    devices: initialDeviceState,
    isDeviceCheckComplete: false,
    isChatOpen: false,
    isSettingsOpen: false,
    isWaitingRoomOpen: false,
    startTime: null,
    duration: 0,

    // Call Actions
    setCallStatus: (status) => set({ callStatus: status }),

    joinCall: (roomUrl, appointmentId) => set({
        roomUrl,
        appointmentId,
        callStatus: 'connecting',
        startTime: null,
        duration: 0,
    }),

    leaveCall: () => set({
        callStatus: 'ended',
        roomUrl: null,
        participants: [],
        localParticipant: null,
        isScreenSharing: false,
        isPipActive: false,
    }),

    // Control Actions
    toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
    toggleVideo: () => set((state) => ({ isVideoOff: !state.isVideoOff })),
    toggleScreenShare: () => set((state) => ({ isScreenSharing: !state.isScreenSharing })),
    togglePip: () => set((state) => ({ isPipActive: !state.isPipActive })),

    // Device Actions
    setDevices: (devices) => set((state) => ({
        devices: { ...state.devices, ...devices }
    })),

    selectDevice: (type, deviceId) => set((state) => {
        const key = type === 'audio'
            ? 'selectedAudioInput'
            : type === 'video'
                ? 'selectedVideoInput'
                : 'selectedAudioOutput';
        return { devices: { ...state.devices, [key]: deviceId } };
    }),

    completeDeviceCheck: () => set({ isDeviceCheckComplete: true }),

    // Participant Actions
    addParticipant: (participant) => set((state) => ({
        participants: [...state.participants, participant],
    })),

    removeParticipant: (id) => set((state) => ({
        participants: state.participants.filter((p) => p.id !== id),
    })),

    updateParticipant: (id, updates) => set((state) => ({
        participants: state.participants.map((p) =>
            p.id === id ? { ...p, ...updates } : p
        ),
    })),

    // UI Actions
    toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
    toggleSettings: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
    toggleWaitingRoom: () => set((state) => ({ isWaitingRoomOpen: !state.isWaitingRoomOpen })),

    // Timer Actions
    startTimer: () => set({ startTime: new Date() }),
    incrementDuration: () => set((state) => ({ duration: state.duration + 1 })),
    resetTimer: () => set({ startTime: null, duration: 0 }),
}));

// Selectors
export const selectIsInCall = (state: VideoState) =>
    state.callStatus === 'connected' || state.callStatus === 'reconnecting';

export const selectFormattedDuration = (state: VideoState) => {
    const mins = Math.floor(state.duration / 60);
    const secs = state.duration % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};
