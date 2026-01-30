"use client";

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    PhoneOff,
    Monitor,
    MonitorOff,
    MessageSquare,
    Settings,
    MoreVertical
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VideoControlsProps {
    isMuted: boolean;
    isVideoOff: boolean;
    isScreenSharing: boolean;
    isChatOpen: boolean;
    onToggleMute: () => void;
    onToggleVideo: () => void;
    onToggleScreenShare: () => void;
    onToggleChat: () => void;
    onEndCall: () => void;
    className?: string;
}

export function VideoControls({
    isMuted,
    isVideoOff,
    isScreenSharing,
    isChatOpen,
    onToggleMute,
    onToggleVideo,
    onToggleScreenShare,
    onToggleChat,
    onEndCall,
    className,
}: VideoControlsProps) {
    return (
        <div className={cn(
            "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900/90 to-transparent",
            className
        )}>
            <div className="flex items-center justify-center gap-3">
                {/* Mute Button */}
                <Button
                    size="lg"
                    variant="ghost"
                    onClick={onToggleMute}
                    className={cn(
                        "rounded-full h-14 w-14 transition-all",
                        isMuted
                            ? "bg-red-500/20 hover:bg-red-500/30 text-red-500"
                            : "bg-slate-700/80 hover:bg-slate-600 text-white"
                    )}
                    title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                    {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                </Button>

                {/* Video Button */}
                <Button
                    size="lg"
                    variant="ghost"
                    onClick={onToggleVideo}
                    className={cn(
                        "rounded-full h-14 w-14 transition-all",
                        isVideoOff
                            ? "bg-red-500/20 hover:bg-red-500/30 text-red-500"
                            : "bg-slate-700/80 hover:bg-slate-600 text-white"
                    )}
                    title={isVideoOff ? 'Turn on camera (V)' : 'Turn off camera (V)'}
                >
                    {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                </Button>

                {/* Screen Share Button */}
                <Button
                    size="lg"
                    variant="ghost"
                    onClick={onToggleScreenShare}
                    className={cn(
                        "rounded-full h-14 w-14 transition-all",
                        isScreenSharing
                            ? "bg-teal-500/20 hover:bg-teal-500/30 text-teal-500"
                            : "bg-slate-700/80 hover:bg-slate-600 text-white"
                    )}
                    title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                >
                    {isScreenSharing ? <MonitorOff className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
                </Button>

                {/* Chat Button */}
                <Button
                    size="lg"
                    variant="ghost"
                    onClick={onToggleChat}
                    className={cn(
                        "rounded-full h-14 w-14 transition-all",
                        isChatOpen
                            ? "bg-teal-500/20 hover:bg-teal-500/30 text-teal-500"
                            : "bg-slate-700/80 hover:bg-slate-600 text-white"
                    )}
                    title="Toggle chat"
                >
                    <MessageSquare className="h-6 w-6" />
                </Button>

                {/* More Options */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="lg"
                            variant="ghost"
                            className="rounded-full h-14 w-14 bg-slate-700/80 hover:bg-slate-600 text-white"
                        >
                            <MoreVertical className="h-6 w-6" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48">
                        <DropdownMenuItem>
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-slate-500">
                            Keyboard shortcuts:
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled className="text-xs text-slate-400">
                            M - Toggle mute
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled className="text-xs text-slate-400">
                            V - Toggle video
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* End Call Button */}
                <Button
                    size="lg"
                    onClick={onEndCall}
                    className="rounded-full h-14 w-14 bg-red-500 hover:bg-red-600 text-white ml-4"
                    title="End call"
                >
                    <PhoneOff className="h-6 w-6" />
                </Button>
            </div>

            {/* Keyboard Shortcut Hint */}
            <div className="flex justify-center mt-2">
                <p className="text-slate-500 text-xs">
                    Press <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">M</kbd> to mute,{' '}
                    <kbd className="px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">V</kbd> for video
                </p>
            </div>
        </div>
    );
}
