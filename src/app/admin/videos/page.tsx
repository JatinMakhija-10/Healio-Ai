"use client";

import { useEffect, useState } from "react";
import { api, WellnessVideo } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Film,
    Search,
    Trash2,
    Eye,
    EyeOff,
    Loader2,
    Play,
    Clock,
    User,
    ExternalLink,
    AlertTriangle,
    CheckCircle2,
    BarChart3,
    TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { value: "all", label: "All Categories" },
    { value: "yoga", label: "Yoga" },
    { value: "ayurveda", label: "Ayurveda" },
    { value: "naturopathy", label: "Naturopathy" },
    { value: "meditation", label: "Meditation" },
    { value: "exercise", label: "Exercise" },
    { value: "nutrition", label: "Nutrition" },
    { value: "siddha", label: "Siddha" },
    { value: "unani", label: "Unani" },
    { value: "homeopathy", label: "Homeopathy" },
    { value: "other", label: "Other" },
];

const CATEGORY_COLORS: Record<string, string> = {
    yoga: "bg-purple-100 text-purple-700",
    ayurveda: "bg-green-100 text-green-700",
    naturopathy: "bg-emerald-100 text-emerald-700",
    meditation: "bg-blue-100 text-blue-700",
    exercise: "bg-orange-100 text-orange-700",
    nutrition: "bg-amber-100 text-amber-700",
    siddha: "bg-rose-100 text-rose-700",
    unani: "bg-cyan-100 text-cyan-700",
    homeopathy: "bg-indigo-100 text-indigo-700",
    other: "bg-slate-100 text-slate-700",
};

function formatDuration(seconds: number | null) {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

export default function AdminVideosPage() {
    const [videos, setVideos] = useState<WellnessVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
    const [selectedVideo, setSelectedVideo] = useState<WellnessVideo | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    async function fetchVideos() {
        setLoading(true);
        try {
            const data = await api.getAllVideosAdmin();
            setVideos(data);
        } catch (err) {
            console.error("Error fetching videos:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchVideos();
    }, []);

    // Client-side filtering
    const filteredVideos = videos.filter((v) => {
        const matchesSearch =
            !searchQuery ||
            v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            v.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesCategory = categoryFilter === "all" || v.category === categoryFilter;

        const matchesStatus =
            statusFilter === "all" ||
            (statusFilter === "published" && v.is_published) ||
            (statusFilter === "draft" && !v.is_published);

        return matchesSearch && matchesCategory && matchesStatus;
    });

    async function handleTogglePublish(video: WellnessVideo) {
        try {
            await api.adminToggleVideoPublish(video.id, !video.is_published);
            setVideos((prev) =>
                prev.map((v) =>
                    v.id === video.id ? { ...v, is_published: !v.is_published } : v
                )
            );
        } catch (err) {
            console.error("Error toggling publish:", err);
        }
    }

    async function handleDelete(videoId: string) {
        try {
            await api.adminDeleteVideo(videoId);
            setVideos((prev) => prev.filter((v) => v.id !== videoId));
            setDeleteConfirm(null);
        } catch (err) {
            console.error("Error deleting video:", err);
        }
    }

    // Stats
    const totalVideos = videos.length;
    const publishedCount = videos.filter((v) => v.is_published).length;
    const draftCount = videos.filter((v) => !v.is_published).length;
    const totalViews = videos.reduce((sum, v) => sum + v.views_count, 0);
    const uniqueDoctors = new Set(videos.map((v) => v.doctor_id)).size;

    // Category breakdown
    const categoryBreakdown = CATEGORIES.slice(1).map((cat) => ({
        ...cat,
        count: videos.filter((v) => v.category === cat.value).length,
    })).filter((c) => c.count > 0);

    return (
        <div className="space-y-6 pb-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Film className="h-5 w-5 text-white" />
                    </div>
                    Video Management
                </h1>
                <p className="text-slate-500 mt-1">
                    Review, moderate, and manage all wellness videos uploaded by doctors.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                                <Film className="h-5 w-5 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Total Videos</p>
                                <p className="text-xl font-bold text-slate-900">{totalVideos}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Published</p>
                                <p className="text-xl font-bold text-green-600">{publishedCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                                <AlertTriangle className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Drafts</p>
                                <p className="text-xl font-bold text-amber-600">{draftCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                                <BarChart3 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Total Views</p>
                                <p className="text-xl font-bold text-blue-600">{totalViews.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-slate-200 shadow-sm">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-teal-600" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Uploaders</p>
                                <p className="text-xl font-bold text-teal-600">{uniqueDoctors}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Breakdown */}
            {categoryBreakdown.length > 0 && (
                <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                            Category Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-2">
                            {categoryBreakdown.map((cat) => (
                                <Badge
                                    key={cat.value}
                                    className={cn("text-xs px-3 py-1", CATEGORY_COLORS[cat.value])}
                                >
                                    {cat.label}: {cat.count}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by title, description, or doctor name…"
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-48">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {CATEGORIES.map((c) => (
                            <SelectItem key={c.value} value={c.value}>
                                {c.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                    <SelectTrigger className="w-40">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="published">Published</SelectItem>
                        <SelectItem value="draft">Drafts</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                        <p className="text-sm text-slate-500">Loading all videos…</p>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && filteredVideos.length === 0 && (
                <div className="text-center py-20">
                    <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Film className="h-8 w-8 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-2">
                        {videos.length === 0 ? "No videos uploaded yet" : "No matching videos"}
                    </h3>
                    <p className="text-sm text-slate-500">
                        {videos.length === 0
                            ? "Videos uploaded by doctors will appear here for moderation."
                            : "Try adjusting your search or filters."}
                    </p>
                </div>
            )}

            {/* Video Table */}
            {!loading && filteredVideos.length > 0 && (
                <Card className="border-slate-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                                        Video
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                                        Doctor
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                                        Category
                                    </th>
                                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                                        Status
                                    </th>
                                    <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                                        Views
                                    </th>
                                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                                        Uploaded
                                    </th>
                                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-3">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredVideos.map((video) => (
                                    <tr key={video.id} className="hover:bg-slate-50/80 transition-colors">
                                        {/* Video Info */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="h-12 w-20 rounded-lg bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center shrink-0 cursor-pointer hover:from-slate-300 hover:to-slate-400 transition-colors"
                                                    onClick={() => setSelectedVideo(video)}
                                                >
                                                    <Play className="h-4 w-4 text-slate-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p
                                                        className="text-sm font-medium text-slate-900 truncate max-w-[250px] cursor-pointer hover:text-purple-600 transition-colors"
                                                        onClick={() => setSelectedVideo(video)}
                                                    >
                                                        {video.title}
                                                    </p>
                                                    {video.description && (
                                                        <p className="text-xs text-slate-400 truncate max-w-[250px]">
                                                            {video.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Doctor */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-full bg-purple-100 flex items-center justify-center">
                                                    <User className="h-3.5 w-3.5 text-purple-700" />
                                                </div>
                                                <span className="text-sm text-slate-700 font-medium">
                                                    {video.doctor_name || "Unknown"}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Category */}
                                        <td className="px-4 py-3">
                                            <Badge className={cn("text-[10px]", CATEGORY_COLORS[video.category] || CATEGORY_COLORS.other)}>
                                                {video.category}
                                            </Badge>
                                        </td>

                                        {/* Status */}
                                        <td className="px-4 py-3 text-center">
                                            {video.is_published ? (
                                                <Badge className="bg-green-100 text-green-700 text-[10px]">
                                                    Published
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-amber-100 text-amber-700 text-[10px]">
                                                    Draft
                                                </Badge>
                                            )}
                                        </td>

                                        {/* Views */}
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1 text-sm text-slate-600">
                                                <Eye className="h-3.5 w-3.5 text-slate-400" />
                                                {video.views_count.toLocaleString()}
                                            </div>
                                        </td>

                                        {/* Date */}
                                        <td className="px-4 py-3">
                                            <span className="text-sm text-slate-500">
                                                {formatDate(video.created_at)}
                                            </span>
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        "h-8 w-8",
                                                        video.is_published
                                                            ? "text-green-600 hover:text-amber-600 hover:bg-amber-50"
                                                            : "text-amber-600 hover:text-green-600 hover:bg-green-50"
                                                    )}
                                                    onClick={() => handleTogglePublish(video)}
                                                    title={video.is_published ? "Unpublish" : "Publish"}
                                                >
                                                    {video.is_published ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <a
                                                    href={video.video_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                    title="Open source URL"
                                                >
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                                {deleteConfirm === video.id ? (
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-xs text-red-600 hover:bg-red-50 px-2"
                                                            onClick={() => handleDelete(video.id)}
                                                        >
                                                            Confirm
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 text-xs text-slate-400 hover:bg-slate-100 px-2"
                                                            onClick={() => setDeleteConfirm(null)}
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => setDeleteConfirm(video.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
                        <p className="text-xs text-slate-500">
                            Showing {filteredVideos.length} of {videos.length} total videos
                        </p>
                    </div>
                </Card>
            )}

            {/* Video Preview Modal */}
            <Dialog open={!!selectedVideo} onOpenChange={(open) => !open && setSelectedVideo(null)}>
                <DialogContent className="sm:max-w-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-4 pb-0">
                        <DialogTitle className="text-base font-bold text-slate-900 pr-8">
                            {selectedVideo?.title}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedVideo && (
                        <div className="space-y-3 pb-4">
                            <div className="aspect-video bg-black flex items-center justify-center">
                                <a
                                    href={selectedVideo.video_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex flex-col items-center gap-2 text-white/60 hover:text-white/90 transition-colors"
                                >
                                    <Play className="h-12 w-12" />
                                    <span className="text-sm flex items-center gap-1.5">
                                        Open Video <ExternalLink className="h-3.5 w-3.5" />
                                    </span>
                                </a>
                            </div>
                            <div className="px-4 space-y-2">
                                <div className="flex items-center gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                                            <User className="h-3.5 w-3.5 text-purple-700" />
                                        </div>
                                        <span className="font-medium text-slate-700">{selectedVideo.doctor_name}</span>
                                    </div>
                                    <Badge className={cn("text-[10px]", CATEGORY_COLORS[selectedVideo.category])}>
                                        {selectedVideo.category}
                                    </Badge>
                                    <span className="text-slate-400 ml-auto text-xs">
                                        {selectedVideo.views_count} views · {formatDate(selectedVideo.created_at)}
                                    </span>
                                </div>
                                {selectedVideo.description && (
                                    <p className="text-sm text-slate-600">{selectedVideo.description}</p>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        size="sm"
                                        variant={selectedVideo.is_published ? "outline" : "default"}
                                        className={cn(
                                            "gap-1.5 text-xs",
                                            !selectedVideo.is_published && "bg-green-600 hover:bg-green-700"
                                        )}
                                        onClick={() => {
                                            handleTogglePublish(selectedVideo);
                                            setSelectedVideo({
                                                ...selectedVideo,
                                                is_published: !selectedVideo.is_published,
                                            });
                                        }}
                                    >
                                        {selectedVideo.is_published ? (
                                            <><EyeOff className="h-3.5 w-3.5" /> Unpublish</>
                                        ) : (
                                            <><Eye className="h-3.5 w-3.5" /> Publish</>
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="gap-1.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                        onClick={() => {
                                            handleDelete(selectedVideo.id);
                                            setSelectedVideo(null);
                                        }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" /> Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
