"use client";

import { useEffect, useState } from "react";
import { api, WellnessVideo } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Search,
    Play,
    Eye,
    Clock,
    Film,
    Loader2,
    User,
    X,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { value: "all", label: "All" },
    { value: "yoga", label: "🧘 Yoga", color: "bg-purple-100 text-purple-700 border-purple-200" },
    { value: "ayurveda", label: "🌿 Ayurveda", color: "bg-green-100 text-green-700 border-green-200" },
    { value: "naturopathy", label: "🍃 Naturopathy", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    { value: "meditation", label: "🧠 Meditation", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "exercise", label: "💪 Exercise", color: "bg-orange-100 text-orange-700 border-orange-200" },
    { value: "nutrition", label: "🥗 Nutrition", color: "bg-amber-100 text-amber-700 border-amber-200" },
    { value: "siddha", label: "🔬 Siddha", color: "bg-rose-100 text-rose-700 border-rose-200" },
    { value: "unani", label: "🏺 Unani", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
    { value: "homeopathy", label: "💊 Homeopathy", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    { value: "other", label: "📦 Other", color: "bg-slate-100 text-slate-700 border-slate-200" },
];

function getCategoryStyle(cat: string) {
    return CATEGORIES.find((c) => c.value === cat) || CATEGORIES[CATEGORIES.length - 1];
}

function formatDuration(seconds: number | null) {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function isEmbeddable(url: string): string | null {
    // YouTube
    const ytMatch = url.match(
        /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    // Direct video URL
    if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return url;

    return null;
}

export default function PatientVideosPage() {
    const [videos, setVideos] = useState<WellnessVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeCategory, setActiveCategory] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedVideo, setSelectedVideo] = useState<WellnessVideo | null>(null);
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

    async function fetchVideos(category?: string, search?: string) {
        setLoading(true);
        try {
            const data = await api.getPublishedVideos({
                category: category || activeCategory,
                search: search ?? searchQuery,
            });
            setVideos(data);
        } catch (err) {
            console.error("Error fetching videos:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchVideos();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function handleCategoryChange(cat: string) {
        setActiveCategory(cat);
        fetchVideos(cat, searchQuery);
    }

    function handleSearchChange(value: string) {
        setSearchQuery(value);
        if (searchTimeout) clearTimeout(searchTimeout);
        const timeout = setTimeout(() => {
            fetchVideos(activeCategory, value);
        }, 400);
        setSearchTimeout(timeout);
    }

    async function handlePlayVideo(video: WellnessVideo) {
        setSelectedVideo(video);
        // Increment view count in background
        try {
            await api.incrementVideoViews(video.id);
        } catch {
            // Non-critical
        }
    }

    return (
        <div className="space-y-6 pb-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/20">
                        <Film className="h-5 w-5 text-white" />
                    </div>
                    Wellness Videos
                </h1>
                <p className="text-slate-500 mt-1">
                    Watch expert-curated yoga, Ayurveda, meditation, and wellness videos from your doctors.
                </p>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search videos…"
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.value}
                        onClick={() => handleCategoryChange(cat.value)}
                        className={cn(
                            "px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all duration-200",
                            activeCategory === cat.value
                                ? cat.value === "all"
                                    ? "bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-500/20"
                                    : cn(cat.color, "ring-2 ring-offset-1 ring-current shadow-sm")
                                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700"
                        )}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                        <p className="text-sm text-slate-500">Loading videos…</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && videos.length === 0 && (
                <div className="text-center py-20">
                    <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Film className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">No videos found</h3>
                    <p className="text-sm text-slate-500 max-w-sm mx-auto">
                        {searchQuery || activeCategory !== "all"
                            ? "Try adjusting your search or filters."
                            : "Your doctors haven't uploaded any videos yet. Check back soon!"}
                    </p>
                </div>
            )}

            {/* Video Grid */}
            {!loading && videos.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {videos.map((video) => {
                        const cat = getCategoryStyle(video.category);
                        return (
                            <Card
                                key={video.id}
                                className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-slate-200 hover:border-teal-200"
                                onClick={() => handlePlayVideo(video)}
                            >
                                {/* Thumbnail */}
                                <div className="relative aspect-video bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden">
                                    {video.thumbnail_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={video.thumbnail_url}
                                            alt={video.title}
                                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : null}
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors" />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="h-12 w-12 rounded-full bg-white/90 shadow-xl flex items-center justify-center transform scale-90 group-hover:scale-100 transition-transform">
                                            <Play className="h-5 w-5 text-teal-600 ml-0.5" />
                                        </div>
                                    </div>

                                    {video.duration_seconds && (
                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
                                            <Clock className="h-3 w-3" />
                                            {formatDuration(video.duration_seconds)}
                                        </div>
                                    )}
                                </div>

                                <CardContent className="p-4 space-y-2.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-teal-700 transition-colors">
                                            {video.title}
                                        </h3>
                                    </div>

                                    {video.description && (
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            {video.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-6 rounded-full bg-teal-100 flex items-center justify-center">
                                                <User className="h-3.5 w-3.5 text-teal-700" />
                                            </div>
                                            <span className="text-xs text-slate-600 font-medium">
                                                {video.doctor_name || "Practitioner"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <Badge className={cn("text-[10px]", cat.color)}>
                                                {cat.label}
                                            </Badge>
                                            <span className="flex items-center gap-1">
                                                <Eye className="h-3 w-3" />
                                                {video.views_count}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Video Player Modal */}
            <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
                <DialogContent className="sm:max-w-3xl p-0 overflow-hidden">
                    <DialogHeader className="p-4 pb-0">
                        <div className="flex items-start justify-between">
                            <DialogTitle className="text-lg font-bold text-slate-900 pr-8">
                                {selectedVideo?.title}
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    {selectedVideo && (() => {
                        const embedUrl = isEmbeddable(selectedVideo.video_url);
                        const isDirectVideo = embedUrl && /\.(mp4|webm|ogg|mov)(\?|$)/i.test(selectedVideo.video_url);

                        return (
                            <div className="space-y-4">
                                {/* Player */}
                                <div className="aspect-video bg-black">
                                    {isDirectVideo ? (
                                        <video
                                            src={embedUrl}
                                            controls
                                            autoPlay
                                            className="w-full h-full"
                                        />
                                    ) : embedUrl ? (
                                        <iframe
                                            src={embedUrl}
                                            className="w-full h-full"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            allowFullScreen
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full gap-3">
                                            <Play className="h-12 w-12 text-white/40" />
                                            <a
                                                href={selectedVideo.video_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-teal-400 hover:text-teal-300 flex items-center gap-1.5 text-sm"
                                            >
                                                Open in new tab
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="px-4 pb-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                                            <User className="h-4 w-4 text-teal-700" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-slate-900">
                                                {selectedVideo.doctor_name || "Practitioner"}
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                                {new Date(selectedVideo.created_at).toLocaleDateString("en-IN", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                        <Badge className={cn("ml-auto text-[10px]", getCategoryStyle(selectedVideo.category).color)}>
                                            {getCategoryStyle(selectedVideo.category).label}
                                        </Badge>
                                    </div>
                                    {selectedVideo.description && (
                                        <p className="text-sm text-slate-600 leading-relaxed">
                                            {selectedVideo.description}
                                        </p>
                                    )}
                                </div>

                                {/* Related Videos */}
                                {(() => {
                                    const related = videos
                                        .filter(v => v.category === selectedVideo.category && v.id !== selectedVideo.id)
                                        .slice(0, 3);

                                    if (related.length === 0) return null;

                                    return (
                                        <div className="px-4 pb-6 pt-2 border-t border-slate-100">
                                            <h4 className="text-sm font-semibold text-slate-900 mb-3">Related Videos</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                {related.map(video => (
                                                    <div
                                                        key={video.id}
                                                        className="group cursor-pointer space-y-2"
                                                        onClick={() => setSelectedVideo(video)}
                                                    >
                                                        <div className="relative aspect-video rounded-lg overflow-hidden bg-slate-100">
                                                            {video.thumbnail_url ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={video.thumbnail_url}
                                                                    alt={video.title}
                                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                                />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-slate-200">
                                                                    <Film className="h-6 w-6 text-slate-400" />
                                                                </div>
                                                            )}
                                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                                        </div>
                                                        <p className="text-xs font-medium text-slate-700 line-clamp-2 group-hover:text-teal-700 transition-colors">
                                                            {video.title}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}
