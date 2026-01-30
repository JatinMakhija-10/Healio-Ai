"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Paperclip, MoreVertical, Phone, Video } from "lucide-react";

// Mock Data
const chats = [
    { id: 1, appointmentId: "APT-1002", name: "Priya Sharma", lastMsg: "Thank you doctor, the pain is less now.", time: "10:30 AM", unread: 2, avatar: "P" },
    { id: 2, appointmentId: "APT-1003", name: "Rahul Verma", lastMsg: "Should I continue the same dosage?", time: "Yesterday", unread: 0, avatar: "R" },
    { id: 3, appointmentId: "APT-1004", name: "Sarah Jenkins", lastMsg: "Appointment confirmation", time: "Mon", unread: 0, avatar: "S" },
    { id: 4, appointmentId: "APT-1005", name: "Amit Patel", lastMsg: "Report attached", time: "Sun", unread: 0, avatar: "A" },
];

const messages = [
    { id: 1, sender: "doctor", text: "Hello Priya, how are you feeling today?", time: "10:00 AM" },
    { id: 2, sender: "patient", text: "Hi Doctor. Much better than before.", time: "10:15 AM" },
    { id: 3, sender: "patient", text: "The headache has reduced significantly.", time: "10:16 AM" },
    { id: 4, sender: "doctor", text: "That's great to hear. Are you still experiencing any nausea?", time: "10:20 AM" },
    { id: 5, sender: "patient", text: "No, the nausea is gone completely.", time: "10:25 AM" },
    { id: 6, sender: "patient", text: "Thank you doctor, the pain is less now.", time: "10:30 AM" },
];

export default function InboxPage() {
    const router = useRouter();
    const [selectedChat, setSelectedChat] = useState(chats[0]);
    const [replyText, setReplyText] = useState("");

    const handleSend = () => {
        if (!replyText.trim()) return;
        // Mock send
        setReplyText("");
    };

    return (
        <div className="h-[calc(100vh-8rem)] flex gap-6">
            {/* Chat List (Sidebar) */}
            <Card className="w-80 flex flex-col shrink-0">
                <div className="p-4 border-b">
                    <h2 className="font-bold text-lg mb-4">Messages</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input placeholder="Search chats..." className="pl-9 bg-slate-50 border-slate-200" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {chats.map((chat) => (
                        <div
                            key={chat.id}
                            className={`p-4 flex gap-3 hover:bg-slate-50 cursor-pointer border-l-4 transition-all ${selectedChat.id === chat.id
                                ? "bg-teal-50/50 border-teal-500"
                                : "border-transparent"
                                }`}
                            onClick={() => setSelectedChat(chat)}
                        >
                            <Avatar>
                                <AvatarFallback className={`${selectedChat.id === chat.id ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {chat.avatar}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <span className={`font-semibold text-sm ${selectedChat.id === chat.id ? 'text-teal-900' : 'text-slate-900'}`}>{chat.name}</span>
                                    <span className="text-xs text-slate-400">{chat.time}</span>
                                </div>
                                <p className="text-xs text-slate-500 truncate">{chat.lastMsg}</p>
                            </div>
                            {chat.unread > 0 && (
                                <div className="flex flex-col justify-center">
                                    <Badge className="bg-teal-600 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                                        {chat.unread}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Chat Window */}
            <Card className="flex-1 flex flex-col overflow-hidden shadow-md border-slate-200">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-white z-10">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarFallback className="bg-teal-100 text-teal-700">
                                {selectedChat.avatar}
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="font-bold text-slate-900">{selectedChat.name}</h3>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                <span className="text-xs text-slate-500">Active now</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                            <Phone className="h-5 w-5 text-slate-400" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/doctor/consult/${(selectedChat as any).appointmentId}`)}
                            title="Start Video Call"
                        >
                            <Video className="h-5 w-5 text-teal-600" />
                        </Button>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5 text-slate-400" />
                        </Button>
                    </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
                    <div className="text-center text-xs text-slate-400 my-4">Today</div>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[70%] rounded-2xl p-4 shadow-sm ${msg.sender === 'doctor'
                                    ? 'bg-teal-600 text-white rounded-br-none'
                                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed">{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${msg.sender === 'doctor' ? 'text-teal-100/70' : 'text-slate-400'}`}>
                                    {msg.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Input Area */}
                <div className="p-4 bg-white border-t">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="shrink-0 text-slate-400 hover:text-slate-600">
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <Input
                            placeholder="Type your message..."
                            className="flex-1 bg-slate-50 border-slate-200 focus:bg-white transition-all shadow-inner"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <Button
                            className={`shrink-0 transition-all ${replyText.trim() ? "bg-teal-600 hover:bg-teal-700" : "bg-slate-200 text-slate-400 hover:bg-slate-300"
                                }`}
                            disabled={!replyText.trim()}
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
            </Card>
        </div>
    );
}
