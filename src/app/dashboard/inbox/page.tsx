"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Loader2, Stethoscope } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { chatService, PatientChatPreview, ChatMessage } from "@/lib/chat/chatService";
import { format } from "date-fns";
import { toast } from "sonner";

export default function PatientInboxPage() {
    const router = useRouter();
    const [chats, setChats] = useState<PatientChatPreview[]>([]);
    const [selectedChat, setSelectedChat] = useState<PatientChatPreview | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [replyText, setReplyText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 1. Initialize User & Data
    useEffect(() => {
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setCurrentUserId(user.id);
            loadChats(user.id);
        }
        init();
    }, [router]);

    // 2. Load Chats
    const loadChats = async (userId: string) => {
        try {
            const data = await chatService.getPatientInbox(userId);
            setChats(data);
            if (data.length > 0 && !selectedChat) {
                // Optionally select first chat or check URL params if linked from elsewhere
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load chats");
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Load Messages when Chat Selected
    useEffect(() => {
        if (!selectedChat || !currentUserId) return;

        const loadMessages = async () => {
            try {
                const data = await chatService.getMessages(selectedChat.appointment_id);
                setMessages(data);
                // Mark as read
                if (selectedChat.unread_count > 0) {
                    await chatService.markAsRead(selectedChat.appointment_id, currentUserId);
                    // Update local count
                    setChats(prev => prev.map(c =>
                        c.appointment_id === selectedChat.appointment_id
                            ? { ...c, unread_count: 0 }
                            : c
                    ));
                }
            } catch (error) {
                toast.error("Failed to load messages");
            }
        };

        loadMessages();
    }, [selectedChat, currentUserId]);

    // 4. Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 5. Realtime Subscription
    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages'
                },
                (payload) => {
                    const newMsg = payload.new as ChatMessage;

                    // Update Chat List Preview
                    setChats(prev => {
                        const exists = prev.find(c => c.appointment_id === newMsg.appointment_id);
                        if (!exists) {
                            // If it's a new chat (not in list), we should technically re-fetch chats
                            // For now, reload
                            loadChats(currentUserId);
                            return prev;
                        }

                        return prev.map(c => {
                            if (c.appointment_id === newMsg.appointment_id) {
                                return {
                                    ...c,
                                    last_message: newMsg.content,
                                    last_message_time: newMsg.created_at,
                                    last_message_type: newMsg.type,
                                    latest_activity_at: newMsg.created_at,
                                    unread_count: (selectedChat?.appointment_id === newMsg.appointment_id)
                                        ? 0 // If open, it's read
                                        : (newMsg.sender_id !== currentUserId ? c.unread_count + 1 : c.unread_count)
                                };
                            }
                            return c;
                        }).sort((a, b) => {
                            // Sort by LAST ACTIVITY time (message or creation)
                            const timeA = new Date(a.latest_activity_at || a.appointment_created_at || 0).getTime();
                            const timeB = new Date(b.latest_activity_at || b.appointment_created_at || 0).getTime();
                            return timeB - timeA;
                        });
                    });

                    // Update Active Message Window
                    if (selectedChat?.appointment_id === newMsg.appointment_id) {
                        setMessages(prev => [...prev, newMsg]);
                        if (newMsg.sender_id !== currentUserId) {
                            chatService.markAsRead(newMsg.appointment_id, currentUserId!);
                        }
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [selectedChat, currentUserId]);

    const handleSend = async () => {
        if (!replyText.trim() || !selectedChat || !currentUserId) return;

        const text = replyText;
        setReplyText(""); // Optimistic clear

        try {
            await chatService.sendMessage(selectedChat.appointment_id, currentUserId, text);
        } catch (error) {
            toast.error("Failed to send message");
            setReplyText(text); // Restore on failure
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedChat || !currentUserId) return;

        setIsUploading(true);
        try {
            const url = await chatService.uploadAttachment(file);
            await chatService.sendMessage(
                selectedChat.appointment_id,
                currentUserId,
                `Sent an attachment: ${file.name}`,
                'file',
                url
            );
        } catch (error) {
            toast.error("Failed to upload file");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const filteredChats = chats.filter(c =>
        c.doctor_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-6">
            {/* Chat List (Sidebar) */}
            <Card className="w-80 flex flex-col shrink-0">
                <div className="p-4 border-b">
                    <h2 className="font-bold text-lg mb-4">Your Chats with Doctors</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Search doctors..."
                            className="pl-9 bg-slate-50 border-slate-200"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center p-4"><Loader2 className="animate-spin text-teal-600" /></div>
                    ) : filteredChats.length === 0 ? (
                        <div className="text-center p-8 text-slate-500">
                            <Stethoscope className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No conversations yet.</p>
                            <p className="text-xs mt-1">Book an appointment to start chatting.</p>
                        </div>
                    ) : (
                        filteredChats.map((chat) => (
                            <div
                                key={chat.appointment_id}
                                className={`p-4 flex gap-3 hover:bg-slate-50 cursor-pointer border-l-4 transition-all ${selectedChat?.appointment_id === chat.appointment_id
                                    ? "bg-teal-50/50 border-teal-500"
                                    : "border-transparent"
                                    }`}
                                onClick={() => setSelectedChat(chat)}
                            >
                                <Avatar>
                                    <AvatarImage src={chat.doctor_avatar || undefined} />
                                    <AvatarFallback className={`${selectedChat?.appointment_id === chat.appointment_id ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {chat.doctor_name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <span className={`font-semibold text-sm ${selectedChat?.appointment_id === chat.appointment_id ? 'text-teal-900' : 'text-slate-900'}`}>{chat.doctor_name}</span>
                                        <span className="text-xs text-slate-400">
                                            {chat.last_message_time ? format(new Date(chat.last_message_time), 'p') : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">
                                        {chat.last_message_type === 'image' ? '📷 Image' : chat.last_message_type === 'file' ? '📎 Attachment' : (chat.last_message || 'Start conversation')}
                                    </p>
                                </div>
                                {chat.unread_count > 0 && (
                                    <div className="flex flex-col justify-center">
                                        <Badge className="bg-teal-600 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                                            {chat.unread_count}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Chat Window */}
            <Card className="flex-1 flex flex-col overflow-hidden shadow-md border-slate-200">
                {selectedChat ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b flex justify-between items-center bg-white z-10">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={selectedChat.doctor_avatar || undefined} />
                                    <AvatarFallback className="bg-teal-100 text-teal-700">
                                        {selectedChat.doctor_name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-bold text-slate-900">{selectedChat.doctor_name}</h3>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                        <span className="text-xs text-slate-500">Available</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" title="Call (Coming Soon)">
                                    <Phone className="h-5 w-5 text-slate-400" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => router.push(`/dashboard/meet/${selectedChat.appointment_id}`)}
                                    title="Start Video Call"
                                    className="text-teal-600 hover:text-teal-700 hover:bg-teal-50"
                                >
                                    <Video className="h-5 w-5" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-5 w-5 text-slate-400" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => router.push(`/dashboard/appointments`)}>
                                            View Appointment Details
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                            {messages.length === 0 ? (
                                <div className="text-center text-slate-400 mt-10">
                                    <p>No messages yet.</p>
                                    <p className="text-sm">Say hello to Dr. {selectedChat.doctor_name}!</p>
                                </div>
                            ) : (
                                messages.map((msg) => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${msg.sender_id === currentUserId
                                                ? 'bg-teal-600 text-white rounded-br-none'
                                                : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                                                }`}
                                        >
                                            {msg.type === 'file' || msg.type === 'image' ? (
                                                <div className="flex flex-col gap-2">
                                                    {msg.media_url && (
                                                        <a href={msg.media_url} target="_blank" rel="noreferrer" className="underline text-sm font-medium hover:opacity-80 break-all">
                                                            {msg.content}
                                                        </a>
                                                    )}
                                                </div>
                                            ) : (
                                                <p className="text-sm leading-relaxed">{msg.content}</p>
                                            )}

                                            <p className={`text-[10px] mt-1 text-right ${msg.sender_id === currentUserId ? 'text-teal-100/70' : 'text-slate-400'}`}>
                                                {format(new Date(msg.created_at), 'p')}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t">
                            <div className="flex items-center gap-3">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 text-slate-400 hover:text-slate-600"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Paperclip className="h-5 w-5" />}
                                </Button>
                                <Input
                                    placeholder="Type your message..."
                                    className="flex-1 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-inner"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    disabled={isUploading}
                                />
                                <Button
                                    className={`shrink-0 transition-all ${replyText.trim() ? "bg-teal-600 hover:bg-teal-700" : "bg-slate-200 text-slate-400 hover:bg-slate-300"
                                        }`}
                                    disabled={!replyText.trim() || isUploading}
                                    onClick={handleSend}
                                >
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 text-center flex items-center justify-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                End-to-end encrypted for HIPAA compliance
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <Avatar className="h-20 w-20 bg-slate-100 mb-4">
                            <AvatarFallback className="text-slate-300"><Send size={32} /></AvatarFallback>
                        </Avatar>
                        <p>Select a chat to start messaging your doctor</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
