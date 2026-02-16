/**
 * WebRTC Peer-to-Peer Video Call Service
 *
 * Uses Supabase Realtime Broadcast for signaling (SDP offer/answer + ICE candidates).
 * No external video SDK required — browser-native RTCPeerConnection only.
 */
import { supabase } from '@/lib/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WebRTCRole = 'caller' | 'answerer';

export interface WebRTCCallbacks {
    onRemoteStream: (stream: MediaStream) => void;
    onConnectionStateChange: (state: RTCPeerConnectionState) => void;
    onIceConnectionStateChange: (state: RTCIceConnectionState) => void;
    onError: (error: Error) => void;
}

interface SignalPayload {
    type: 'offer' | 'answer' | 'ice-candidate' | 'hangup';
    sender: string;
    sdp?: RTCSessionDescriptionInit;
    candidate?: RTCIceCandidateInit;
}

// ---------------------------------------------------------------------------
// ICE Configuration (free Google STUN – sufficient for dev + most users)
// ---------------------------------------------------------------------------

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
];

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class WebRTCService {
    private pc: RTCPeerConnection | null = null;
    private channel: RealtimeChannel | null = null;
    private localStream: MediaStream | null = null;
    private remoteStream: MediaStream | null = null;
    private roomId: string;
    private peerId: string;
    private role: WebRTCRole;
    private callbacks: WebRTCCallbacks;
    private pendingCandidates: RTCIceCandidateInit[] = [];
    private hasRemoteDescription = false;
    private _disposed = false;

    constructor(
        roomId: string,
        peerId: string,
        role: WebRTCRole,
        callbacks: WebRTCCallbacks,
    ) {
        this.roomId = roomId;
        this.peerId = peerId;
        this.role = role;
        this.callbacks = callbacks;
    }

    // ----- Public API -------------------------------------------------------

    /**
     * Initialise: create peer connection, attach local stream, subscribe to
     * signaling channel, and – if caller – create & send the SDP offer.
     */
    async start(localStream: MediaStream): Promise<void> {
        if (this._disposed) return;
        this.localStream = localStream;

        // 1. Create RTCPeerConnection
        this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // 2. Add local tracks to the connection
        for (const track of localStream.getTracks()) {
            this.pc.addTrack(track, localStream);
        }

        // 3. Listen for remote tracks
        this.remoteStream = new MediaStream();
        this.pc.ontrack = (event) => {
            const tracks = event.streams[0]?.getTracks() ?? [event.track];
            for (const track of tracks) {
                this.remoteStream!.addTrack(track);
            }
            this.callbacks.onRemoteStream(this.remoteStream!);
        };

        // 4. ICE candidate handling – trickle to remote via signaling
        this.pc.onicecandidate = (event) => {
            if (event.candidate && this.channel) {
                this.channel.send({
                    type: 'broadcast',
                    event: 'signal',
                    payload: {
                        type: 'ice-candidate',
                        sender: this.peerId,
                        candidate: event.candidate.toJSON(),
                    } satisfies SignalPayload,
                });
            }
        };

        // 5. Connection state callbacks
        this.pc.onconnectionstatechange = () => {
            if (this.pc) {
                this.callbacks.onConnectionStateChange(this.pc.connectionState);
            }
        };
        this.pc.oniceconnectionstatechange = () => {
            if (this.pc) {
                this.callbacks.onIceConnectionStateChange(this.pc.iceConnectionState);
                // Auto-reconnect on transient failures
                if (this.pc.iceConnectionState === 'failed') {
                    this.pc.restartIce();
                }
            }
        };

        // 6. Subscribe to signaling channel
        await this.subscribeSignaling();

        // 7. If caller, create and send the offer
        if (this.role === 'caller') {
            await this.createAndSendOffer();
        }
    }

    /** Hangup – notify remote, stop tracks, close everything */
    async hangup(): Promise<void> {
        if (this._disposed) return;
        this._disposed = true;

        // Notify remote
        if (this.channel) {
            this.channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: {
                    type: 'hangup',
                    sender: this.peerId,
                } satisfies SignalPayload,
            });
        }

        this.cleanup();
    }

    /** Toggle audio track enabled state. Returns new muted state. */
    setAudioEnabled(enabled: boolean): void {
        if (!this.localStream) return;
        for (const track of this.localStream.getAudioTracks()) {
            track.enabled = enabled;
        }
    }

    /** Toggle video track enabled state. Returns new hidden state. */
    setVideoEnabled(enabled: boolean): void {
        if (!this.localStream) return;
        for (const track of this.localStream.getVideoTracks()) {
            track.enabled = enabled;
        }
    }

    /** Replace the video track with a screen-share track (or revert). */
    async replaceVideoTrack(newTrack: MediaStreamTrack): Promise<void> {
        if (!this.pc) return;
        const sender = this.pc.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
            await sender.replaceTrack(newTrack);
        }
    }

    /** Get basic connection stats for quality indicator */
    async getStats(): Promise<{ rtt: number; packetsLost: number; jitter: number } | null> {
        if (!this.pc) return null;
        try {
            const stats = await this.pc.getStats();
            let rtt = 0;
            let packetsLost = 0;
            let jitter = 0;
            stats.forEach((report) => {
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    rtt = report.currentRoundTripTime ?? 0;
                }
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    packetsLost = report.packetsLost ?? 0;
                    jitter = report.jitter ?? 0;
                }
            });
            return { rtt, packetsLost, jitter };
        } catch {
            return null;
        }
    }

    // ----- Private ----------------------------------------------------------

    private async subscribeSignaling(): Promise<void> {
        const channelName = `webrtc:${this.roomId}`;
        this.channel = supabase.channel(channelName, {
            config: { broadcast: { self: false } },
        });

        this.channel.on('broadcast', { event: 'signal' }, async (msg) => {
            const payload = msg.payload as SignalPayload;
            if (payload.sender === this.peerId) return; // ignore own messages

            try {
                switch (payload.type) {
                    case 'offer':
                        await this.handleOffer(payload.sdp!);
                        break;
                    case 'answer':
                        await this.handleAnswer(payload.sdp!);
                        break;
                    case 'ice-candidate':
                        await this.handleIceCandidate(payload.candidate!);
                        break;
                    case 'hangup':
                        this.cleanup();
                        this.callbacks.onConnectionStateChange('closed');
                        break;
                }
            } catch (err) {
                console.error('[WebRTC] Signal handling error:', err);
                this.callbacks.onError(err instanceof Error ? err : new Error(String(err)));
            }
        });

        await this.channel.subscribe();
    }

    private async createAndSendOffer(): Promise<void> {
        if (!this.pc || !this.channel) return;
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);

        this.channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
                type: 'offer',
                sender: this.peerId,
                sdp: this.pc.localDescription!.toJSON(),
            } satisfies SignalPayload,
        });
    }

    private async handleOffer(sdp: RTCSessionDescriptionInit): Promise<void> {
        if (!this.pc || !this.channel) return;
        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        this.hasRemoteDescription = true;
        await this.flushPendingCandidates();

        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);

        this.channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: {
                type: 'answer',
                sender: this.peerId,
                sdp: this.pc.localDescription!.toJSON(),
            } satisfies SignalPayload,
        });
    }

    private async handleAnswer(sdp: RTCSessionDescriptionInit): Promise<void> {
        if (!this.pc) return;
        await this.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        this.hasRemoteDescription = true;
        await this.flushPendingCandidates();
    }

    private async handleIceCandidate(candidate: RTCIceCandidateInit): Promise<void> {
        if (!this.pc) return;
        if (!this.hasRemoteDescription) {
            // Queue candidates received before remote description is set
            this.pendingCandidates.push(candidate);
            return;
        }
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
    }

    private async flushPendingCandidates(): Promise<void> {
        if (!this.pc) return;
        for (const c of this.pendingCandidates) {
            await this.pc.addIceCandidate(new RTCIceCandidate(c));
        }
        this.pendingCandidates = [];
    }

    private cleanup(): void {
        // Close peer connection
        if (this.pc) {
            this.pc.ontrack = null;
            this.pc.onicecandidate = null;
            this.pc.onconnectionstatechange = null;
            this.pc.oniceconnectionstatechange = null;
            this.pc.close();
            this.pc = null;
        }

        // Unsubscribe signaling channel
        if (this.channel) {
            supabase.removeChannel(this.channel);
            this.channel = null;
        }

        // Stop remote stream tracks
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(t => t.stop());
            this.remoteStream = null;
        }
    }
}
