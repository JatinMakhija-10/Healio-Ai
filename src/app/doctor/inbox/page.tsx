"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
    Search,
    Send,
    Paperclip,
    MoreVertical,
    Phone,
    Video,
    Loader2,
    Smile,
    CheckCheck,
    Check,
    Image as ImageIcon,
    FileText,
    X,
    Mic,
    Star,
    Filter,
    RefreshCw,
    ClipboardList,
    AlertCircle,
    ChevronDown,
    MessageSquarePlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { chatService, ChatPreview, ChatMessage } from "@/lib/chat/chatService";
import { format, isToday, isYesterday } from "date-fns";
import { toast } from "sonner";
import { api } from "@/lib/api";

// ─── Emoji Picker Data ────────────────────────────────────────────────────────
const EMOJI_LIST = ["😊", "👍", "❤️", "😔", "🙏", "✅", "⚠️", "💊", "🏥", "📋", "🩺", "💉", "🌡️", "😷", "🤒"];

// ─── Quick Replies for Doctor ─────────────────────────────────────────────────
const QUICK_REPLIES = [
    "Please take your medication as prescribed.",
    "Schedule a follow-up appointment in 2 weeks.",
    "If symptoms worsen, visit the emergency room immediately.",
    "Avoid strenuous exercise for the next 48 hours.",
    "Drink plenty of water and rest well.",
    "Your reports look normal. No further action needed.",
    "I have reviewed your reports. Let's discuss in the next appointment.",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMessageTime(dateStr: string) {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "p");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
}

function formatChatTime(dateStr?: string) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, "p");
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
}

// ─── Dummy chat data ──────────────────────────────────────────────────────────
const buildDummyChats = (doctorId: string): ChatPreview[] => [
    {
        appointment_id: "dummy-1",
        doctor_id: doctorId,
        patient_id: "p-1",
        patient_name: "Rahul Sharma",
        patient_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
        last_message: "Doctor, when should I take the medicine?",
        last_message_time: new Date().toISOString(),
        last_message_type: "text",
        unread_count: 2,
    },
    {
        appointment_id: "dummy-2",
        doctor_id: doctorId,
        patient_id: "p-2",
        patient_name: "Priya Singh",
        patient_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
        last_message: "Thank you for the consultation, doctor.",
        last_message_time: new Date(Date.now() - 3_600_000).toISOString(),
        last_message_type: "text",
        unread_count: 0,
    },
    {
        appointment_id: "dummy-3",
        doctor_id: doctorId,
        patient_id: "p-3",
        patient_name: "Amit Verma",
        patient_avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Amit",
        last_message: "📋 Sent a file: lab_results.pdf",
        last_message_time: new Date(Date.now() - 7_200_000).toISOString(),
        last_message_type: "file",
        unread_count: 1,
    },
];

const buildDummyMessages = (appointmentId: string, doctorUserId: string): ChatMessage[] => {
    if (appointmentId === "dummy-1") {
        return [
            {
                id: "m1",
                appointment_id: "dummy-1",
                sender_id: "p-1",
                content: "Hello doctor, I'm feeling a bit better today.",
                type: "text",
                created_at: new Date(Date.now() - 3_600_000 * 2).toISOString(),
                is_read: true,
            },
            {
                id: "m2",
                appointment_id: "dummy-1",
                sender_id: doctorUserId,
                content: "Great to hear that! Keep taking the prescribed medication.",
                type: "text",
                created_at: new Date(Date.now() - 3_600_000 * 1.5).toISOString(),
                is_read: true,
            },
            {
                id: "m3",
                appointment_id: "dummy-1",
                sender_id: "p-1",
                content: "Doctor, when should I take the medicine?",
                type: "text",
                created_at: new Date(Date.now() - 60_000).toISOString(),
                is_read: false,
            },
        ];
    }
    if (appointmentId === "dummy-2") {
        return [
            {
                id: "m4",
                appointment_id: "dummy-2",
                sender_id: "p-2",
                content: "Good morning doctor.",
                type: "text",
                created_at: new Date(Date.now() - 7_200_000).toISOString(),
                is_read: true,
            },
            {
                id: "m5",
                appointment_id: "dummy-2",
                sender_id: doctorUserId,
                content: "Good morning Priya! How can I help you today?",
                type: "text",
                created_at: new Date(Date.now() - 7_000_000).toISOString(),
                is_read: true,
            },
            {
                id: "m6",
                appointment_id: "dummy-2",
                sender_id: "p-2",
                content: "Thank you for the consultation, doctor.",
                type: "text",
                created_at: new Date(Date.now() - 6_800_000).toISOString(),
                is_read: true,
            },
        ];
    }
    if (appointmentId === "dummy-3") {
        return [
            {
                id: "m7",
                appointment_id: "dummy-3",
                sender_id: "p-3",
                content: "Sent an attachment: lab_results.pdf",
                type: "file",
                media_url: "#",
                created_at: new Date(Date.now() - 3_600_000).toISOString(),
                is_read: false,
            },
        ];
    }
    return [];
};

// ─── Main Component ────────────────────────────────────────────────────────────
export default function InboxPage() {
    const router = useRouter();

    const [chats, setChats] = useState<ChatPreview[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatPreview | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [replyText, setReplyText] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isOtherTyping, setIsOtherTyping] = useState(false);
    const [showQuickReplies, setShowQuickReplies] = useState(false);
    const [filterUnread, setFilterUnread] = useState(false);
    const [imagePreview, setImagePreview] = useState<{ url: string; name: string } | null>(null);
    const [isSending, setIsSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // ── Init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        async function init() {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) {
                router.push("/login");
                return;
            }
            setCurrentUserId(user.id);

            let doctorId = await chatService.getDoctorId(user.id);
            if (!doctorId) {
                try {
                    await api.createDoctorProfile(user.id, {
                        fullName:
                            user.user_metadata.full_name ||
                            "Dr. " + (user.email?.split("@")[0] || "User"),
                        phone: "",
                        specialty: ["General Practice"],
                        qualification: "MBBS",
                        experienceYears: 1,
                        bio: "Healio Doctor",
                        licenseNumber: "PENDING",
                        consultationFee: 50,
                        availability: {},
                    });
                    doctorId = await chatService.getDoctorId(user.id);
                    if (!doctorId) throw new Error("Creation failed");
                } catch {
                    toast.error("Profile setup failed. Redirecting to onboarding.");
                    router.push("/doctor/onboarding");
                    return;
                }
            }
            setCurrentDoctorId(doctorId);
            loadChats(doctorId, user.id);
        }
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    // ── Load Chats ────────────────────────────────────────────────────────────
    const loadChats = useCallback(async (doctorId: string, userId?: string) => {
        try {
            const real = await chatService.getInboxChats(doctorId);
            const dummy = buildDummyChats(doctorId);
            // Merge: real chats first, then dummy ones not in real
            const realIds = new Set(real.map((c) => c.appointment_id));
            const merged = [...real, ...dummy.filter((d) => !realIds.has(d.appointment_id))];
            setChats(merged);
        } catch {
            setChats(buildDummyChats(doctorId));
        } finally {
            setIsLoading(false);
        }
    }, []);

    // ── Load Messages ─────────────────────────────────────────────────────────
    useEffect(() => {
        if (!selectedChat || !currentUserId) return;

        const loadMessages = async () => {
            try {
                // Try real data first
                if (!selectedChat.appointment_id.startsWith("dummy-")) {
                    const data = await chatService.getMessages(selectedChat.appointment_id);
                    setMessages(data);
                    if (selectedChat.unread_count > 0) {
                        await chatService.markAsRead(selectedChat.appointment_id, currentUserId);
                        setChats((prev) =>
                            prev.map((c) =>
                                c.appointment_id === selectedChat.appointment_id
                                    ? { ...c, unread_count: 0 }
                                    : c
                            )
                        );
                    }
                } else {
                    // Load dummy messages
                    setMessages(buildDummyMessages(selectedChat.appointment_id, currentUserId));
                    setChats((prev) =>
                        prev.map((c) =>
                            c.appointment_id === selectedChat.appointment_id
                                ? { ...c, unread_count: 0 }
                                : c
                        )
                    );
                }
            } catch {
                toast.error("Failed to load messages");
            }
        };

        loadMessages();
        // Simulate other user typing occasionally
        simulateTyping();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedChat?.appointment_id, currentUserId]);

    // ── Auto-scroll ───────────────────────────────────────────────────────────
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isOtherTyping]);

    // ── Realtime Subscription ─────────────────────────────────────────────────
    useEffect(() => {
        if (!currentDoctorId) return;

        const channel = supabase
            .channel("doctor-inbox-realtime")
            .on(
                "postgres_changes",
                { event: "INSERT", schema: "public", table: "messages" },
                (payload) => {
                    const newMsg = payload.new as ChatMessage;

                    setChats((prev) => {
                        const exists = prev.find((c) => c.appointment_id === newMsg.appointment_id);
                        if (!exists) {
                            if (currentDoctorId) loadChats(currentDoctorId);
                            return prev;
                        }
                        return prev
                            .map((c) => {
                                if (c.appointment_id === newMsg.appointment_id) {
                                    return {
                                        ...c,
                                        last_message: newMsg.content,
                                        last_message_time: newMsg.created_at,
                                        last_message_type: newMsg.type,
                                        unread_count:
                                            selectedChat?.appointment_id === newMsg.appointment_id
                                                ? 0
                                                : newMsg.sender_id !== currentUserId
                                                    ? c.unread_count + 1
                                                    : c.unread_count,
                                    };
                                }
                                return c;
                            })
                            .sort(
                                (a, b) =>
                                    new Date(b.last_message_time!).getTime() -
                                    new Date(a.last_message_time!).getTime()
                            );
                    });

                    if (selectedChat?.appointment_id === newMsg.appointment_id) {
                        setMessages((prev) => [...prev, newMsg]);
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
    }, [currentDoctorId, selectedChat, currentUserId, loadChats]);

    // ── Typing Simulator (demo) ───────────────────────────────────────────────
    const simulateTyping = () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        // For dummy chats, simulate a short typing indicator then stop
        setIsOtherTyping(false);
        if (
            selectedChat?.appointment_id === "dummy-1" ||
            selectedChat?.appointment_id === "dummy-3"
        ) {
            setTimeout(() => {
                setIsOtherTyping(true);
                typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
            }, 1500);
        }
    };

    // ── Send Message ──────────────────────────────────────────────────────────
    const handleSend = async () => {
        if (!replyText.trim() || !selectedChat || !currentUserId) return;

        const text = replyText;
        setReplyText("");
        setShowEmojiPicker(false);
        setShowQuickReplies(false);
        setIsSending(true);

        // Optimistic update
        const optimisticMsg: ChatMessage = {
            id: `optimistic-${Date.now()}`,
            appointment_id: selectedChat.appointment_id,
            sender_id: currentUserId,
            content: text,
            type: "text",
            created_at: new Date().toISOString(),
            is_read: false,
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        // Update chat list preview
        setChats((prev) =>
            prev.map((c) =>
                c.appointment_id === selectedChat.appointment_id
                    ? { ...c, last_message: text, last_message_time: new Date().toISOString() }
                    : c
            )
        );

        try {
            if (!selectedChat.appointment_id.startsWith("dummy-")) {
                await chatService.sendMessage(selectedChat.appointment_id, currentUserId, text);
            }
        } catch {
            toast.error("Failed to send message");
            setReplyText(text);
            setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
        } finally {
            setIsSending(false);
        }
    };

    // ── File Upload ───────────────────────────────────────────────────────────
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedChat || !currentUserId) return;

        setIsUploading(true);
        const isImage = file.type.startsWith("image/");

        // Show preview for images
        if (isImage) {
            const objectUrl = URL.createObjectURL(file);
            setImagePreview({ url: objectUrl, name: file.name });
        }

        try {
            let url = "#";
            if (!selectedChat.appointment_id.startsWith("dummy-")) {
                url = await chatService.uploadAttachment(file);
                await chatService.sendMessage(
                    selectedChat.appointment_id,
                    currentUserId,
                    isImage ? `Sent an image: ${file.name}` : `Sent an attachment: ${file.name}`,
                    isImage ? "image" : "file",
                    url
                );
            } else {
                // Optimistic for dummy chats
                const dummyMsg: ChatMessage = {
                    id: `dummy-file-${Date.now()}`,
                    appointment_id: selectedChat.appointment_id,
                    sender_id: currentUserId,
                    content: isImage ? `Sent an image: ${file.name}` : `Sent an attachment: ${file.name}`,
                    type: isImage ? "image" : "file",
                    media_url: isImage ? URL.createObjectURL(file) : "#",
                    created_at: new Date().toISOString(),
                    is_read: false,
                };
                setMessages((prev) => [...prev, dummyMsg]);
                toast.success(isImage ? "Image sent!" : "File sent!");
            }
        } catch {
            toast.error("Failed to upload file");
        } finally {
            setIsUploading(false);
            setImagePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            if (imageInputRef.current) imageInputRef.current.value = "";
        }
    };

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleEmojiClick = (emoji: string) => {
        setReplyText((prev) => prev + emoji);
        textareaRef.current?.focus();
    };

    const handleQuickReply = (reply: string) => {
        setReplyText(reply);
        setShowQuickReplies(false);
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // ── Filters ───────────────────────────────────────────────────────────────
    const filteredChats = chats
        .filter((c) => c.patient_name.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter((c) => (!filterUnread ? true : c.unread_count > 0));

    const totalUnread = chats.reduce((sum, c) => sum + c.unread_count, 0);

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="h-[calc(100vh-8rem)] flex gap-4">
            {/* ── Sidebar ───────────────────────────────────────────────────── */}
            <Card className="w-80 flex flex-col shrink-0 overflow-hidden shadow-md">
                {/* Header */}
                <div className="p-4 border-b bg-gradient-to-r from-teal-600 to-teal-700">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-lg text-white flex items-center gap-2">
                            Messages
                            {totalUnread > 0 && (
                                <Badge className="bg-white text-teal-700 text-xs px-1.5 py-0.5">
                                    {totalUnread}
                                </Badge>
                            )}
                        </h2>
                        <div className="flex gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8"
                                onClick={() => setFilterUnread((v) => !v)}
                                title={filterUnread ? "Show all" : "Show unread only"}
                            >
                                <Filter className={`h-4 w-4 ${filterUnread ? "fill-white" : ""}`} />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-white/80 hover:text-white hover:bg-white/20 h-8 w-8"
                                onClick={() => currentDoctorId && loadChats(currentDoctorId)}
                                title="Refresh"
                            >
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-teal-200" />
                        <Input
                            placeholder="Search patients..."
                            className="pl-9 bg-white/20 border-white/30 text-white placeholder:text-teal-200 focus:bg-white/30"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="animate-spin text-teal-600 h-6 w-6" />
                        </div>
                    ) : filteredChats.length === 0 ? (
                        <div className="text-center p-8 text-slate-500">
                            <MessageSquarePlus className="h-10 w-10 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No conversations found.</p>
                        </div>
                    ) : (
                        filteredChats.map((chat) => {
                            const isSelected = selectedChat?.appointment_id === chat.appointment_id;
                            return (
                                <div
                                    key={chat.appointment_id}
                                    className={`p-3 flex gap-3 cursor-pointer border-l-4 transition-all hover:bg-slate-50 ${isSelected
                                            ? "bg-teal-50 border-teal-500"
                                            : "border-transparent"
                                        }`}
                                    onClick={() => setSelectedChat(chat)}
                                >
                                    <div className="relative shrink-0">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={chat.patient_avatar || undefined} />
                                            <AvatarFallback
                                                className={`text-sm font-bold ${isSelected
                                                        ? "bg-teal-100 text-teal-700"
                                                        : "bg-slate-100 text-slate-600"
                                                    }`}
                                            >
                                                {chat.patient_name.charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span
                                                className={`font-semibold text-sm truncate ${isSelected ? "text-teal-900" : "text-slate-900"
                                                    } ${chat.unread_count > 0 ? "font-bold" : ""}`}
                                            >
                                                {chat.patient_name}
                                            </span>
                                            <span className="text-[10px] text-slate-400 ml-1 shrink-0">
                                                {formatChatTime(chat.last_message_time)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate">
                                            {chat.last_message_type === "image"
                                                ? "📷 Image"
                                                : chat.last_message_type === "file"
                                                    ? "📎 Attachment"
                                                    : chat.last_message || "No messages yet"}
                                        </p>
                                    </div>
                                    {chat.unread_count > 0 && (
                                        <div className="flex items-center">
                                            <Badge className="bg-teal-600 h-5 min-w-[1.25rem] p-0 flex items-center justify-center rounded-full text-[10px]">
                                                {chat.unread_count}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </Card>

            {/* ── Chat Window ───────────────────────────────────────────────── */}
            <Card className="flex-1 flex flex-col overflow-hidden shadow-md border-slate-200 relative">
                {selectedChat ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-3 border-b flex justify-between items-center bg-white z-10 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={selectedChat.patient_avatar || undefined} />
                                        <AvatarFallback className="bg-teal-100 text-teal-700 font-bold">
                                            {selectedChat.patient_name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 leading-tight">
                                        {selectedChat.patient_name}
                                    </h3>
                                    <div className="flex items-center gap-1.5">
                                        {isOtherTyping ? (
                                            <span className="text-xs text-teal-600 font-medium animate-pulse">
                                                typing...
                                            </span>
                                        ) : (
                                            <>
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                                <span className="text-xs text-slate-500">Active now</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Voice call (coming soon)"
                                    className="text-slate-400 hover:text-slate-600 h-9 w-9"
                                >
                                    <Phone className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        router.push(`/doctor/consult/${selectedChat.appointment_id}`)
                                    }
                                    title="Start Video Consultation"
                                    className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 h-9 w-9"
                                >
                                    <Video className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Quick Prescription"
                                    className="text-violet-600 hover:text-violet-700 hover:bg-violet-50 h-9 w-9"
                                    onClick={() =>
                                        toast.info("Prescription module opening...", {
                                            description: `For patient: ${selectedChat.patient_name}`,
                                        })
                                    }
                                >
                                    <ClipboardList className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-slate-400 hover:text-slate-600 h-9 w-9"
                                        >
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-52">
                                        <DropdownMenuItem
                                            onClick={() =>
                                                router.push(
                                                    `/doctor/patients/${selectedChat.patient_id}`
                                                )
                                            }
                                        >
                                            View Patient Profile
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={() =>
                                                toast.info("Appointment history for " + selectedChat.patient_name)
                                            }
                                        >
                                            View Appointment History
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() =>
                                                toast.warning("This feature will be available soon.")
                                            }
                                            className="text-amber-600"
                                        >
                                            Mark as Important
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => toast.error("Clear Chat History: coming soon.")}
                                        >
                                            Clear Chat History
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-400">
                                    <AlertCircle className="h-10 w-10 opacity-20" />
                                    <p className="text-sm">No messages yet</p>
                                    <p className="text-xs">Start the conversation below</p>
                                </div>
                            ) : (
                                messages.map((msg, idx) => {
                                    const isMe = msg.sender_id === currentUserId;
                                    const showDate =
                                        idx === 0 ||
                                        format(new Date(messages[idx - 1].created_at), "yyyy-MM-dd") !==
                                        format(new Date(msg.created_at), "yyyy-MM-dd");

                                    return (
                                        <div key={msg.id}>
                                            {showDate && (
                                                <div className="flex items-center gap-2 my-2">
                                                    <div className="flex-1 h-px bg-slate-200" />
                                                    <span className="text-[10px] text-slate-400 px-2 py-0.5 bg-white rounded-full border border-slate-200">
                                                        {isToday(new Date(msg.created_at))
                                                            ? "Today"
                                                            : isYesterday(new Date(msg.created_at))
                                                                ? "Yesterday"
                                                                : format(new Date(msg.created_at), "MMM d, yyyy")}
                                                    </span>
                                                    <div className="flex-1 h-px bg-slate-200" />
                                                </div>
                                            )}
                                            <div
                                                className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-2`}
                                            >
                                                {!isMe && (
                                                    <Avatar className="h-7 w-7 shrink-0 mb-1">
                                                        <AvatarImage
                                                            src={selectedChat.patient_avatar || undefined}
                                                        />
                                                        <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                                                            {selectedChat.patient_name.charAt(0)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div
                                                    className={`max-w-[70%] ${isMe ? "items-end" : "items-start"
                                                        } flex flex-col`}
                                                >
                                                    <div
                                                        className={`rounded-2xl px-4 py-2.5 shadow-sm ${isMe
                                                                ? "bg-teal-600 text-white rounded-br-none"
                                                                : "bg-white text-slate-800 border border-slate-100 rounded-bl-none"
                                                            }`}
                                                    >
                                                        {msg.type === "image" ? (
                                                            <div className="flex flex-col gap-1.5">
                                                                {msg.media_url && msg.media_url !== "#" ? (
                                                                    <a
                                                                        href={msg.media_url}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                    >
                                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                        <img
                                                                            src={msg.media_url}
                                                                            alt="attachment"
                                                                            className="max-w-[200px] rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                                                        />
                                                                    </a>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <ImageIcon className="h-4 w-4 opacity-70" />
                                                                        <span className="text-sm">
                                                                            {msg.content}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : msg.type === "file" ? (
                                                            <a
                                                                href={msg.media_url || "#"}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                                                            >
                                                                <FileText className="h-4 w-4 opacity-70 shrink-0" />
                                                                <span className="text-sm underline break-all">
                                                                    {msg.content}
                                                                </span>
                                                            </a>
                                                        ) : (
                                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                                {msg.content}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div
                                                        className={`flex items-center gap-1 mt-0.5 ${isMe ? "flex-row-reverse" : "flex-row"
                                                            }`}
                                                    >
                                                        <span className="text-[10px] text-slate-400">
                                                            {formatMessageTime(msg.created_at)}
                                                        </span>
                                                        {isMe && (
                                                            msg.is_read ? (
                                                                <CheckCheck className="h-3 w-3 text-teal-500" />
                                                            ) : (
                                                                <Check className="h-3 w-3 text-slate-400" />
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}

                            {/* Typing Indicator */}
                            {isOtherTyping && (
                                <div className="flex items-end gap-2">
                                    <Avatar className="h-7 w-7 shrink-0">
                                        <AvatarImage src={selectedChat.patient_avatar || undefined} />
                                        <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                                            {selectedChat.patient_name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                        <div className="flex gap-1 items-center h-4">
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0ms]" />
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:150ms]" />
                                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:300ms]" />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Replies Panel */}
                        {showQuickReplies && (
                            <div className="border-t bg-white px-4 py-2 max-h-40 overflow-y-auto">
                                <p className="text-xs font-semibold text-slate-500 mb-2">
                                    Quick Replies
                                </p>
                                <div className="flex flex-col gap-1">
                                    {QUICK_REPLIES.map((reply, i) => (
                                        <button
                                            key={i}
                                            onClick={() => handleQuickReply(reply)}
                                            className="text-left text-xs text-slate-700 bg-slate-50 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg px-3 py-2 transition-colors"
                                        >
                                            {reply}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Emoji Picker Panel */}
                        {showEmojiPicker && (
                            <div className="border-t bg-white px-4 py-2">
                                <div className="flex flex-wrap gap-2">
                                    {EMOJI_LIST.map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() => handleEmojiClick(emoji)}
                                            className="text-xl hover:scale-125 transition-transform"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="p-3 bg-white border-t">
                            {/* Toolbar */}
                            <div className="flex items-center gap-1 mb-2">
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx,.txt"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                <input
                                    type="file"
                                    ref={imageInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    title="Attach file"
                                >
                                    {isUploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Paperclip className="h-4 w-4" />
                                    )}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
                                    onClick={() => imageInputRef.current?.click()}
                                    disabled={isUploading}
                                    title="Send image"
                                >
                                    <ImageIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 ${showEmojiPicker ? "text-teal-600 bg-teal-50" : "text-slate-400 hover:text-slate-600"}`}
                                    onClick={() => {
                                        setShowEmojiPicker((v) => !v);
                                        setShowQuickReplies(false);
                                    }}
                                    title="Emoji"
                                >
                                    <Smile className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 ${showQuickReplies ? "text-violet-600 bg-violet-50" : "text-slate-400 hover:text-slate-600"}`}
                                    onClick={() => {
                                        setShowQuickReplies((v) => !v);
                                        setShowEmojiPicker(false);
                                    }}
                                    title="Quick Replies"
                                >
                                    <ChevronDown className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-slate-600"
                                    title="Voice message (coming soon)"
                                    onClick={() => toast.info("Voice messages coming soon!")}
                                >
                                    <Mic className="h-4 w-4" />
                                </Button>
                                <div className="flex-1" />
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                    HIPAA Encrypted
                                </span>
                            </div>

                            {/* Text Input */}
                            <div className="flex items-end gap-2">
                                <Textarea
                                    ref={textareaRef}
                                    placeholder="Type your message... (Shift+Enter for new line)"
                                    className="flex-1 min-h-[40px] max-h-[120px] resize-none bg-slate-50 border-slate-200 focus:bg-white text-sm leading-relaxed"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={isUploading}
                                    rows={1}
                                />
                                <Button
                                    className={`shrink-0 h-10 w-10 p-0 transition-all ${replyText.trim()
                                            ? "bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-200"
                                            : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                                        }`}
                                    disabled={!replyText.trim() || isUploading || isSending}
                                    onClick={handleSend}
                                >
                                    {isSending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    // Empty State
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                        <div className="h-24 w-24 rounded-full bg-teal-50 flex items-center justify-center">
                            <MessageSquarePlus className="h-12 w-12 text-teal-300" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-slate-600">Your Messages</p>
                            <p className="text-sm mt-1">
                                Select a conversation from the left to start chatting
                            </p>
                        </div>
                        <div className="flex gap-2 flex-wrap justify-center">
                            {chats.slice(0, 3).map((c) => (
                                <button
                                    key={c.appointment_id}
                                    onClick={() => setSelectedChat(c)}
                                    className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-3 py-1.5 text-xs text-slate-600 hover:border-teal-400 hover:text-teal-700 transition-colors shadow-sm"
                                >
                                    <Avatar className="h-5 w-5">
                                        <AvatarImage src={c.patient_avatar || undefined} />
                                        <AvatarFallback className="text-[8px] bg-teal-100 text-teal-700">
                                            {c.patient_name.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    {c.patient_name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </Card>

            {/* Image Preview Overlay */}
            {imagePreview && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-xl p-4 max-w-sm w-full mx-4 shadow-2xl">
                        <div className="flex justify-between items-center mb-3">
                            <p className="font-semibold text-slate-800">Send Image</p>
                            <button onClick={() => setImagePreview(null)}>
                                <X className="h-5 w-5 text-slate-400 hover:text-slate-600" />
                            </button>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imagePreview.url}
                            alt={imagePreview.name}
                            className="w-full rounded-lg object-contain max-h-64"
                        />
                        <p className="text-xs text-slate-500 mt-2 truncate">{imagePreview.name}</p>
                        <div className="flex gap-2 mt-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => setImagePreview(null)}
                            >
                                Cancel
                            </Button>
                            <Button
                                className="flex-1 bg-teal-600 hover:bg-teal-700"
                                onClick={() => setImagePreview(null)}
                            >
                                Send
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
