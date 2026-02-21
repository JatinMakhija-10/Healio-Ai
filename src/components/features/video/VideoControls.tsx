"use client";

import { useState, useCallback } from 'react';
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
    MoreVertical,
    Hand,
    Smile,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';

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
    onRaiseHand?: (raised: boolean) => void;
    isRecording?: boolean;
    className?: string;
}

const REACTION_EMOJIS = ['👍', '👏', '❤️', '😊', '✋', '🎉'];

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
    onRaiseHand,
    isRecording,
    className,
}: VideoControlsProps) {
    const [showEndConfirm, setShowEndConfirm] = useState(false);
    const [handRaised, setHandRaised] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [floatingReactions, setFloatingReactions] = useState<{ id: number; emoji: string }[]>([]);

    const handleRaiseHand = useCallback(() => {
        const next = !handRaised;
        setHandRaised(next);
        onRaiseHand?.(next);
    }, [handRaised, onRaiseHand]);

    const handleReaction = useCallback((emoji: string) => {
        const id = Date.now();
        setFloatingReactions(prev => [...prev, { id, emoji }]);
        setShowReactions(false);
        // Remove after animation
        setTimeout(() => {
            setFloatingReactions(prev => prev.filter(r => r.id !== id));
        }, 2500);
    }, []);

    const handleEndClick = useCallback(() => {
        setShowEndConfirm(true);
    }, []);

    const confirmEnd = useCallback(() => {
        setShowEndConfirm(false);
        onEndCall();
    }, [onEndCall]);

    return (
        <TooltipProvider delayDuration={300}>
            <div className={cn(
                "absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900/90 to-transparent",
                className
            )}>
                {/* Floating Reactions */}
                <AnimatePresence>
                    {floatingReactions.map(reaction => (
                        <motion.div
                            key={reaction.id}
                            initial={{ opacity: 1, y: 0, x: '-50%' }}
                            animate={{ opacity: 0, y: -120 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 2.2, ease: 'easeOut' }}
                            className="absolute bottom-20 left-1/2 text-4xl pointer-events-none z-30"
                        >
                            {reaction.emoji}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Recording Indicator */}
                {isRecording && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-red-600/90 text-white px-3 py-1 rounded-full text-xs font-medium">
                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        Recording
                    </div>
                )}

                {/* Hand Raised Indicator */}
                <AnimatePresence>
                    {handRaised && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-yellow-500/90 text-white px-3 py-1 rounded-full text-xs font-medium"
                        >
                            <Hand className="h-3.5 w-3.5" />
                            Hand raised
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-center justify-center gap-2 sm:gap-3">
                    {/* Mute Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="lg"
                                variant="ghost"
                                onClick={onToggleMute}
                                className={cn(
                                    "rounded-full h-12 w-12 sm:h-14 sm:w-14 transition-all",
                                    isMuted
                                        ? "bg-red-500/20 hover:bg-red-500/30 text-red-500"
                                        : "bg-slate-700/80 hover:bg-slate-600 text-white"
                                )}
                            >
                                {isMuted ? <MicOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Mic className="h-5 w-5 sm:h-6 sm:w-6" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>{isMuted ? 'Unmute' : 'Mute'} <kbd className="ml-1 px-1 py-0.5 bg-slate-700 rounded text-[10px]">M</kbd></p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Video Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="lg"
                                variant="ghost"
                                onClick={onToggleVideo}
                                className={cn(
                                    "rounded-full h-12 w-12 sm:h-14 sm:w-14 transition-all",
                                    isVideoOff
                                        ? "bg-red-500/20 hover:bg-red-500/30 text-red-500"
                                        : "bg-slate-700/80 hover:bg-slate-600 text-white"
                                )}
                            >
                                {isVideoOff ? <VideoOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Video className="h-5 w-5 sm:h-6 sm:w-6" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>{isVideoOff ? 'Turn on camera' : 'Turn off camera'} <kbd className="ml-1 px-1 py-0.5 bg-slate-700 rounded text-[10px]">V</kbd></p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Screen Share Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="lg"
                                variant="ghost"
                                onClick={onToggleScreenShare}
                                className={cn(
                                    "rounded-full h-12 w-12 sm:h-14 sm:w-14 transition-all",
                                    isScreenSharing
                                        ? "bg-teal-500/20 hover:bg-teal-500/30 text-teal-400"
                                        : "bg-slate-700/80 hover:bg-slate-600 text-white"
                                )}
                            >
                                {isScreenSharing ? <MonitorOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Monitor className="h-5 w-5 sm:h-6 sm:w-6" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>{isScreenSharing ? 'Stop sharing' : 'Share screen'} <kbd className="ml-1 px-1 py-0.5 bg-slate-700 rounded text-[10px]">S</kbd></p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Chat Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="lg"
                                variant="ghost"
                                onClick={onToggleChat}
                                className={cn(
                                    "rounded-full h-12 w-12 sm:h-14 sm:w-14 transition-all",
                                    isChatOpen
                                        ? "bg-teal-500/20 hover:bg-teal-500/30 text-teal-400"
                                        : "bg-slate-700/80 hover:bg-slate-600 text-white"
                                )}
                            >
                                <MessageSquare className="h-5 w-5 sm:h-6 sm:w-6" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>Chat</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Raise Hand Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="lg"
                                variant="ghost"
                                onClick={handleRaiseHand}
                                className={cn(
                                    "rounded-full h-12 w-12 sm:h-14 sm:w-14 transition-all",
                                    handRaised
                                        ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400"
                                        : "bg-slate-700/80 hover:bg-slate-600 text-white"
                                )}
                            >
                                <Hand className="h-5 w-5 sm:h-6 sm:w-6" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>{handRaised ? 'Lower hand' : 'Raise hand'}</p>
                        </TooltipContent>
                    </Tooltip>

                    {/* Reaction Button */}
                    <div className="relative">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="lg"
                                    variant="ghost"
                                    onClick={() => setShowReactions(!showReactions)}
                                    className="rounded-full h-12 w-12 sm:h-14 sm:w-14 bg-slate-700/80 hover:bg-slate-600 text-white transition-all"
                                >
                                    <Smile className="h-5 w-5 sm:h-6 sm:w-6" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                                <p>Reactions</p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Reaction Picker */}
                        <AnimatePresence>
                            {showReactions && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800/95 backdrop-blur-lg rounded-xl p-2 flex gap-1 border border-slate-700 shadow-xl"
                                >
                                    {REACTION_EMOJIS.map(emoji => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleReaction(emoji)}
                                            className="w-10 h-10 rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center text-xl"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* More Options */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                size="lg"
                                variant="ghost"
                                className="rounded-full h-12 w-12 sm:h-14 sm:w-14 bg-slate-700/80 hover:bg-slate-600 text-white"
                            >
                                <MoreVertical className="h-5 w-5 sm:h-6 sm:w-6" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center" className="w-52">
                            <DropdownMenuItem>
                                <Settings className="h-4 w-4 mr-2" />
                                Settings
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem disabled className="text-xs text-slate-500 font-medium">
                                Keyboard Shortcuts
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled className="text-xs text-slate-400">
                                <kbd className="mr-2 px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">M</kbd> Toggle mute
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled className="text-xs text-slate-400">
                                <kbd className="mr-2 px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">V</kbd> Toggle video
                            </DropdownMenuItem>
                            <DropdownMenuItem disabled className="text-xs text-slate-400">
                                <kbd className="mr-2 px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">S</kbd> Screen share
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* End Call Button */}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                size="lg"
                                onClick={handleEndClick}
                                className="rounded-full h-12 w-12 sm:h-14 sm:w-14 bg-red-500 hover:bg-red-600 text-white ml-2 sm:ml-4 shadow-lg shadow-red-500/30"
                            >
                                <PhoneOff className="h-5 w-5 sm:h-6 sm:w-6" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            <p>End call</p>
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Keyboard Shortcut Hint */}
                <div className="flex justify-center mt-2">
                    <p className="text-slate-600 text-[11px]">
                        <kbd className="px-1 py-0.5 bg-slate-700/60 rounded text-slate-400 text-[10px]">M</kbd> mute ·{' '}
                        <kbd className="px-1 py-0.5 bg-slate-700/60 rounded text-slate-400 text-[10px]">V</kbd> video ·{' '}
                        <kbd className="px-1 py-0.5 bg-slate-700/60 rounded text-slate-400 text-[10px]">S</kbd> share
                    </p>
                </div>
            </div>

            {/* End Call Confirmation Dialog */}
            <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>End Consultation?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to end this video consultation? This will disconnect you from the call.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Stay in Call</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmEnd}
                            className="bg-red-500 hover:bg-red-600"
                        >
                            End Call
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TooltipProvider>
    );
}
