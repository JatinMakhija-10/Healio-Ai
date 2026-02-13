"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, WellnessVideo } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Upload,
    Video,
    Plus,
    Trash2,
    Edit3,
    Eye,
    EyeOff,
    Loader2,
    Film,
    Link as LinkIcon,
    Play,
    Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { value: "yoga", label: "Yoga", color: "bg-purple-100 text-purple-700" },
    { value: "ayurveda", label: "Ayurveda", color: "bg-green-100 text-green-700" },
    { value: "naturopathy", label: "Naturopathy", color: "bg-emerald-100 text-emerald-700" },
    { value: "meditation", label: "Meditation", color: "bg-blue-100 text-blue-700" },
    { value: "exercise", label: "Exercise", color: "bg-orange-100 text-orange-700" },
    { value: "nutrition", label: "Nutrition", color: "bg-amber-100 text-amber-700" },
    { value: "siddha", label: "Siddha", color: "bg-rose-100 text-rose-700" },
    { value: "unani", label: "Unani", color: "bg-cyan-100 text-cyan-700" },
    { value: "homeopathy", label: "Homeopathy", color: "bg-indigo-100 text-indigo-700" },
    { value: "other", label: "Other", color: "bg-slate-100 text-slate-700" },
];

function getCategoryBadge(cat: string) {
    const found = CATEGORIES.find((c) => c.value === cat);
    return found || CATEGORIES[CATEGORIES.length - 1];
}

function formatDuration(seconds: number | null) {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function DoctorVideosPage() {
    const { user } = useAuth();
    const [doctorId, setDoctorId] = useState<string | null>(null);
    const [videos, setVideos] = useState<WellnessVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingVideo, setEditingVideo] = useState<WellnessVideo | null>(null);
    const [uploadMode, setUploadMode] = useState<"file" | "url">("url");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("yoga");
    const [videoUrl, setVideoUrl] = useState("");
    const [isPublished, setIsPublished] = useState(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Fetch doctor ID and videos
    useEffect(() => {
        async function load() {
            if (!user) return;
            setLoading(true);
            try {
                const profile = await api.getDoctorProfile(user.id);
                if (profile?.id) {
                    setDoctorId(profile.id);
                    const vids = await api.getDoctorVideos(profile.id);
                    setVideos(vids);
                }
            } catch (err) {
                console.error("Error loading videos:", err);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [user]);

    function resetForm() {
        setTitle("");
        setDescription("");
        setCategory("yoga");
        setVideoUrl("");
        setIsPublished(true);
        setSelectedFile(null);
        setEditingVideo(null);
        setUploadMode("url");
    }

    function openEditDialog(video: WellnessVideo) {
        setEditingVideo(video);
        setTitle(video.title);
        setDescription(video.description || "");
        setCategory(video.category);
        setVideoUrl(video.video_url);
        setIsPublished(video.is_published);
        setUploadMode("url");
        setDialogOpen(true);
    }

    async function handleSubmit() {
        if (!doctorId) return;
        if (!title.trim()) return;

        setUploading(true);
        try {
            let finalUrl = videoUrl;

            // If file upload mode and file selected, upload to Supabase Storage
            if (uploadMode === "file" && selectedFile) {
                const fileExt = selectedFile.name.split(".").pop();
                const filePath = `${doctorId}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from("wellness-videos")
                    .upload(filePath, selectedFile, { cacheControl: "3600", upsert: false });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from("wellness-videos")
                    .getPublicUrl(filePath);
                finalUrl = urlData.publicUrl;
            }

            if (!finalUrl) {
                alert("Please provide a video URL or upload a file.");
                setUploading(false);
                return;
            }

            if (editingVideo) {
                // Update existing
                await api.updateVideo(editingVideo.id, {
                    title,
                    description,
                    category,
                    is_published: isPublished,
                });
                setVideos((prev) =>
                    prev.map((v) =>
                        v.id === editingVideo.id
                            ? { ...v, title, description, category, is_published: isPublished }
                            : v
                    )
                );
            } else {
                // Create new
                const newVideo = await api.uploadVideoMetadata({
                    doctor_id: doctorId,
                    title,
                    description,
                    category,
                    video_url: finalUrl,
                    is_published: isPublished,
                });
                setVideos((prev) => [newVideo, ...prev]);
            }

            setDialogOpen(false);
            resetForm();
        } catch (err) {
            console.error("Error saving video:", err);
            alert("Failed to save video. Please try again.");
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(videoId: string) {
        if (!confirm("Are you sure you want to delete this video?")) return;
        try {
            await api.deleteVideo(videoId);
            setVideos((prev) => prev.filter((v) => v.id !== videoId));
        } catch (err) {
            console.error("Error deleting video:", err);
        }
    }

    async function togglePublished(video: WellnessVideo) {
        try {
            await api.updateVideo(video.id, { is_published: !video.is_published });
            setVideos((prev) =>
                prev.map((v) =>
                    v.id === video.id ? { ...v, is_published: !v.is_published } : v
                )
            );
        } catch (err) {
            console.error("Error toggling publish:", err);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                    <p className="text-sm text-slate-500">Loading your videos…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/20">
                            <Film className="h-5 w-5 text-white" />
                        </div>
                        My Videos
                    </h1>
                    <p className="text-slate-500 mt-1">
                        Upload and manage wellness videos for your patients.
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={(open) => {
                    setDialogOpen(open);
                    if (!open) resetForm();
                }}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white shadow-lg shadow-teal-500/20 gap-2">
                            <Plus className="h-4 w-4" />
                            Upload Video
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Video className="h-5 w-5 text-teal-600" />
                                {editingVideo ? "Edit Video" : "Upload New Video"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 mt-2">
                            <div>
                                <Label htmlFor="title">Title *</Label>
                                <Input
                                    id="title"
                                    placeholder="e.g. Morning Yoga for Beginners"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe what this video covers…"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="mt-1"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label>Category</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger className="mt-1">
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
                            </div>

                            {!editingVideo && (
                                <>
                                    {/* Upload mode toggle */}
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant={uploadMode === "url" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setUploadMode("url")}
                                            className={cn(uploadMode === "url" && "bg-teal-600 hover:bg-teal-700")}
                                        >
                                            <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
                                            Paste URL
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={uploadMode === "file" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setUploadMode("file")}
                                            className={cn(uploadMode === "file" && "bg-teal-600 hover:bg-teal-700")}
                                        >
                                            <Upload className="h-3.5 w-3.5 mr-1.5" />
                                            Upload File
                                        </Button>
                                    </div>

                                    {uploadMode === "url" ? (
                                        <div>
                                            <Label htmlFor="videoUrl">Video URL *</Label>
                                            <Input
                                                id="videoUrl"
                                                placeholder="https://youtube.com/... or any video link"
                                                value={videoUrl}
                                                onChange={(e) => setVideoUrl(e.target.value)}
                                                className="mt-1"
                                            />
                                            <p className="text-xs text-slate-400 mt-1">
                                                Paste a YouTube, Vimeo, or direct video link
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <Label>Video File *</Label>
                                            <div
                                                className="mt-1 border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-teal-400 hover:bg-teal-50/50 transition-colors"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload className="h-8 w-8 mx-auto text-slate-400 mb-2" />
                                                {selectedFile ? (
                                                    <p className="text-sm font-medium text-teal-700">{selectedFile.name}</p>
                                                ) : (
                                                    <>
                                                        <p className="text-sm text-slate-600 font-medium">
                                                            Click to choose a video file
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-1">
                                                            MP4, WebM, MOV — Max 100MB
                                                        </p>
                                                    </>
                                                )}
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="video/*"
                                                className="hidden"
                                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div>
                                    <Label className="text-sm font-medium">Publish immediately</Label>
                                    <p className="text-xs text-slate-400">Visible to patients right away</p>
                                </div>
                                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={uploading || !title.trim()}
                                className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        {editingVideo ? "Saving…" : "Uploading…"}
                                    </>
                                ) : (
                                    editingVideo ? "Save Changes" : "Upload Video"
                                )}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Banner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Videos</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{videos.length}</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Published</p>
                    <p className="text-2xl font-bold text-teal-600 mt-1">
                        {videos.filter((v) => v.is_published).length}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Drafts</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1">
                        {videos.filter((v) => !v.is_published).length}
                    </p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Total Views</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                        {videos.reduce((sum, v) => sum + v.views_count, 0)}
                    </p>
                </div>
            </div>

            {/* Video Grid */}
            {videos.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="py-16 text-center">
                        <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                            <Film className="h-8 w-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 mb-2">No videos yet</h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                            Share your expertise! Upload yoga, meditation, or wellness videos for your patients to learn from.
                        </p>
                        <Button
                            onClick={() => setDialogOpen(true)}
                            className="bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Upload Your First Video
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {videos.map((video) => {
                        const cat = getCategoryBadge(video.category);
                        return (
                            <Card
                                key={video.id}
                                className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-slate-200"
                            >
                                {/* Thumbnail / Preview */}
                                <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                                    <Play className="h-12 w-12 text-white/30 group-hover:text-white/60 transition-colors" />
                                    {!video.is_published && (
                                        <div className="absolute top-2 left-2">
                                            <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-[10px]">
                                                Draft
                                            </Badge>
                                        </div>
                                    )}
                                    {video.duration_seconds && (
                                        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatDuration(video.duration_seconds)}
                                        </div>
                                    )}
                                </div>

                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <h3 className="font-semibold text-slate-900 text-sm line-clamp-2 leading-snug">
                                            {video.title}
                                        </h3>
                                        <Badge className={cn("shrink-0 text-[10px]", cat.color)}>
                                            {cat.label}
                                        </Badge>
                                    </div>

                                    {video.description && (
                                        <p className="text-xs text-slate-500 line-clamp-2">
                                            {video.description}
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <Eye className="h-3.5 w-3.5" />
                                            {video.views_count} views
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-slate-400 hover:text-teal-600"
                                                onClick={() => togglePublished(video)}
                                                title={video.is_published ? "Unpublish" : "Publish"}
                                            >
                                                {video.is_published ? (
                                                    <Eye className="h-3.5 w-3.5" />
                                                ) : (
                                                    <EyeOff className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-slate-400 hover:text-blue-600"
                                                onClick={() => openEditDialog(video)}
                                            >
                                                <Edit3 className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-slate-400 hover:text-red-600"
                                                onClick={() => handleDelete(video.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
