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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
    Search,
    Filter,
    X,
    FileVideo,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
    { value: "yoga", label: "Yoga", color: "bg-purple-100 text-purple-700 hover:bg-purple-200" },
    { value: "ayurveda", label: "Ayurveda", color: "bg-green-100 text-green-700 hover:bg-green-200" },
    { value: "naturopathy", label: "Naturopathy", color: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" },
    { value: "meditation", label: "Meditation", color: "bg-blue-100 text-blue-700 hover:bg-blue-200" },
    { value: "exercise", label: "Exercise", color: "bg-orange-100 text-orange-700 hover:bg-orange-200" },
    { value: "nutrition", label: "Nutrition", color: "bg-amber-100 text-amber-700 hover:bg-amber-200" },
    { value: "siddha", label: "Siddha", color: "bg-rose-100 text-rose-700 hover:bg-rose-200" },
    { value: "unani", label: "Unani", color: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200" },
    { value: "homeopathy", label: "Homeopathy", color: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" },
    { value: "other", label: "Other", color: "bg-slate-100 text-slate-700 hover:bg-slate-200" },
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
    const [uploadProgress, setUploadProgress] = useState(0);

    // Tabs & View State
    const [activeTab, setActiveTab] = useState("videos");
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCategory, setFilterCategory] = useState("all");

    // Form state (Shared for Upload Tab and Edit Dialog)
    const [editingVideo, setEditingVideo] = useState<WellnessVideo | null>(null);
    const [uploadMode, setUploadMode] = useState<"file" | "url">("url");
    const [formState, setFormState] = useState({
        title: "",
        description: "",
        category: "yoga",
        videoUrl: "",
        isPublished: true,
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbnailInputRef = useRef<HTMLInputElement>(null);

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
        setFormState({
            title: "",
            description: "",
            category: "yoga",
            videoUrl: "",
            isPublished: true,
        });
        setSelectedFile(null);
        setSelectedThumbnail(null);
        setThumbnailPreview(null);
        setEditingVideo(null);
        setUploadMode("url");
        setIsDragging(false);
        setUploadProgress(0);
    }

    function openEditDialog(video: WellnessVideo) {
        setEditingVideo(video);
        setFormState({
            title: video.title,
            description: video.description || "",
            category: video.category,
            videoUrl: video.video_url,
            isPublished: video.is_published,
        });
        setThumbnailPreview(video.thumbnail_url || null);
        setSelectedThumbnail(null); // Reset new selection
        setUploadMode("url");
        setEditDialogOpen(true);
    }

    async function handleSubmit() {
        if (!doctorId) return;
        if (!formState.title.trim()) return;

        setUploading(true);
        setUploadProgress(0);

        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => Math.min(prev + Math.random() * 10, 90));
        }, 500);

        try {
            let finalUrl = formState.videoUrl;
            let finalThumbnailUrl = editingVideo?.thumbnail_url || null;

            // 1. Upload Video File (if selected)
            if (uploadMode === "file" && selectedFile) {
                const fileExt = selectedFile.name.split(".").pop();
                const filePath = `${doctorId}/${Date.now()}_video.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from("wellness-videos")
                    .upload(filePath, selectedFile, { cacheControl: "3600", upsert: false });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from("wellness-videos")
                    .getPublicUrl(filePath);
                finalUrl = urlData.publicUrl;
            }

            // 2. Upload Thumbnail (if selected)
            if (selectedThumbnail) {
                const fileExt = selectedThumbnail.name.split(".").pop();
                const filePath = `${doctorId}/${Date.now()}_thumb.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from("wellness-videos")
                    .upload(filePath, selectedThumbnail, { cacheControl: "3600", upsert: false });

                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage
                    .from("wellness-videos")
                    .getPublicUrl(filePath);
                finalThumbnailUrl = urlData.publicUrl;
            }

            if (!finalUrl) {
                alert("Please provide a video URL or upload a file.");
                setUploading(false);
                clearInterval(progressInterval);
                return;
            }

            if (editingVideo) {
                // Update existing
                await api.updateVideo(editingVideo.id, {
                    title: formState.title,
                    description: formState.description,
                    category: formState.category,
                    is_published: formState.isPublished,
                    thumbnail_url: finalThumbnailUrl || "",
                });
                setVideos((prev) =>
                    prev.map((v) =>
                        v.id === editingVideo.id
                            ? {
                                ...v,
                                title: formState.title,
                                description: formState.description,
                                category: formState.category,
                                is_published: formState.isPublished,
                                thumbnail_url: finalThumbnailUrl
                            }
                            : v
                    )
                );
                setEditDialogOpen(false);
            } else {
                // Create new
                const newVideo = await api.uploadVideoMetadata({
                    doctor_id: doctorId,
                    title: formState.title,
                    description: formState.description,
                    category: formState.category,
                    video_url: finalUrl,
                    thumbnail_url: finalThumbnailUrl || undefined,
                    is_published: formState.isPublished,
                });
                setVideos((prev) => [newVideo, ...prev]);
                setActiveTab("videos"); // Switch back to videos list
            }

            setUploadProgress(100);
            setTimeout(() => {
                resetForm();
                setUploadProgress(0);
            }, 500);

        } catch (err) {
            console.error("Error saving video:", err);
            alert("Failed to save video. Please try again.");
        } finally {
            clearInterval(progressInterval);
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

    // Drag & Drop Handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            if (file.type.startsWith("video/")) {
                setSelectedFile(file);
                setUploadMode("file");
                // Auto-fill title from filename
                if (!formState.title) {
                    setFormState(prev => ({
                        ...prev,
                        title: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")
                    }));
                }
            } else {
                alert("Please drop a video file.");
            }
        }
    };

    const handleThumbnailSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                alert("Please select an image file.");
                return;
            }
            setSelectedThumbnail(file);
            setThumbnailPreview(URL.createObjectURL(file));
        }
    };

    // Derived filtered videos
    const filteredVideos = videos.filter(v => {
        const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = filterCategory === 'all' || v.category === filterCategory;
        return matchesSearch && matchesCategory;
    });

    // Form Component (Reusable)
    const VideoForm = () => (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="title">Video Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Morning Yoga for Back Pain"
                            value={formState.title}
                            onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                            className="mt-1"
                        />
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            placeholder="Describe the benefits and steps..."
                            value={formState.description}
                            onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
                            className="mt-1"
                            rows={4}
                        />
                    </div>

                    <div>
                        <Label>Category</Label>
                        <Select
                            value={formState.category}
                            onValueChange={(val) => setFormState(prev => ({ ...prev, category: val }))}
                        >
                            <SelectTrigger className="mt-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((c) => (
                                    <SelectItem key={c.value} value={c.value}>
                                        <div className="flex items-center gap-2">
                                            <div className={cn("w-2 h-2 rounded-full", c.color.split(" ")[0])} />
                                            {c.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div>
                            <Label className="text-base font-medium">Publish Immediately</Label>
                            <p className="text-sm text-slate-500">Make visible to patients right away</p>
                        </div>
                        <Switch
                            checked={formState.isPublished}
                            onCheckedChange={(val) => setFormState(prev => ({ ...prev, isPublished: val }))}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Source Selection */}
                    <div className="bg-white p-1 rounded-lg border border-slate-200 inline-flex w-full">
                        <button
                            type="button"
                            onClick={() => setUploadMode("url")}
                            className={cn(
                                "flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                uploadMode === "url"
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            <LinkIcon className="h-4 w-4" />
                            Use Video URL
                        </button>
                        <button
                            type="button"
                            onClick={() => setUploadMode("file")}
                            className={cn(
                                "flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2",
                                uploadMode === "file"
                                    ? "bg-slate-900 text-white shadow-sm"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            <Upload className="h-4 w-4" />
                            Upload File
                        </button>
                    </div>

                    {uploadMode === "url" ? (
                        <div className="space-y-2">
                            <Label htmlFor="videoUrl">Video / YouTube URL *</Label>
                            <div className="relative">
                                <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                <Input
                                    id="videoUrl"
                                    placeholder="https://youtube.com/watch?v=..."
                                    value={formState.videoUrl}
                                    onChange={(e) => setFormState(prev => ({ ...prev, videoUrl: e.target.value }))}
                                    className="pl-9"
                                />
                            </div>
                            {/* URL Preview */}
                            {formState.videoUrl && (
                                <div className="mt-2 aspect-video bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative group">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Play className="h-10 w-10 text-slate-400" />
                                    </div>
                                    <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-slate-500">Preview Available after save</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <Label>Video File *</Label>
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 group relative",
                                    isDragging
                                        ? "border-teal-500 bg-teal-50/50"
                                        : "border-slate-200 hover:border-teal-400 hover:bg-teal-50/30",
                                    selectedFile && "border-teal-500 bg-teal-50/30"
                                )}
                                onClick={() => fileInputRef.current?.click()}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setSelectedFile(file);
                                            // Auto-fill title
                                            if (!formState.title) {
                                                setFormState(prev => ({
                                                    ...prev,
                                                    title: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " ")
                                                }));
                                            }
                                        }
                                    }}
                                />
                                {selectedFile ? (
                                    <div className="flex flex-col items-center animate-in zoom-in-50 duration-300">
                                        <div className="h-12 w-12 rounded-full bg-teal-100 flex items-center justify-center mb-3">
                                            <FileVideo className="h-6 w-6 text-teal-600" />
                                        </div>
                                        <p className="font-medium text-teal-900">{selectedFile.name}</p>
                                        <p className="text-xs text-teal-600 mt-1">
                                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                                        </p>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="mt-2 text-teal-700 hover:text-teal-900 hover:bg-teal-100"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedFile(null);
                                            }}
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="h-12 w-12 rounded-full bg-slate-100 group-hover:bg-teal-100 transition-colors flex items-center justify-center mb-3">
                                            <Upload className="h-6 w-6 text-slate-400 group-hover:text-teal-600 transition-colors" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-700">
                                            Drag & drop or click to upload
                                        </p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            MP4, WebM, MOV (Max 100MB)
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Thumbnail Upload */}
                    <div>
                        <Label>Thumbnail Image</Label>
                        <div
                            className="mt-2 flex gap-4 p-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group"
                            onClick={() => thumbnailInputRef.current?.click()}
                        >
                            <div className="shrink-0 h-20 w-32 bg-slate-200 rounded-lg overflow-hidden relative">
                                {thumbnailPreview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={thumbnailPreview}
                                        alt="Thumbnail"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-400">
                                        <Film className="h-8 w-8 opacity-50" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Edit3 className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                                <p className="text-sm font-medium text-slate-700">
                                    {thumbnailPreview ? "Change Thumbnail" : "Add Thumbnail"}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Upload a cover image (16:9 recommended)
                                </p>
                            </div>
                            <input
                                ref={thumbnailInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleThumbnailSelect}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {uploading && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Uploading...</span>
                        <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                {editingVideo && (
                    <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                        Cancel
                    </Button>
                )}
                <Button
                    onClick={handleSubmit}
                    disabled={uploading || !formState.title.trim()}
                    className="bg-slate-900 text-white hover:bg-slate-800 min-w-[150px]"
                >
                    {uploading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Processing...
                        </>
                    ) : (
                        <>
                            {editingVideo ? "Save Changes" : "Upload Video"}
                            {!editingVideo && <CheckCircle2 className="h-4 w-4 ml-2" />}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
                    <p className="text-sm text-slate-500">Loading your content...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-12 animate-in fade-in duration-500 container mx-auto max-w-6xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Media Library</h1>
                    <p className="text-slate-500 mt-1">Manage educational content and wellness videos for your patients.</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-slate-50 border-slate-100 shadow-sm">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider">Total Videos</span>
                        <span className="text-2xl font-bold text-slate-900">{videos.length}</span>
                    </CardContent>
                </Card>
                <Card className="bg-teal-50 border-teal-100 shadow-sm">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase text-teal-600 tracking-wider">Published</span>
                        <span className="text-2xl font-bold text-teal-700">{videos.filter(v => v.is_published).length}</span>
                    </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-100 shadow-sm">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase text-amber-600 tracking-wider">Drafts</span>
                        <span className="text-2xl font-bold text-amber-700">{videos.filter(v => !v.is_published).length}</span>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100 shadow-sm">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-xs font-semibold uppercase text-blue-600 tracking-wider">Total Views</span>
                        <span className="text-2xl font-bold text-blue-700">{videos.reduce((acc, v) => acc + v.views_count, 0)}</span>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-slate-100 p-1 rounded-xl w-full sm:w-auto inline-flex">
                    <TabsTrigger value="videos" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <FileVideo className="h-4 w-4 mr-2" />
                        My Videos
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New
                    </TabsTrigger>
                </TabsList>

                {/* TAB 1: VIDEOS LIST */}
                <TabsContent value="videos" className="space-y-6 animate-in slide-in-from-left-2 duration-300">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm sticky top-4 z-10">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by title..."
                                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-full sm:w-[200px] bg-slate-50 border-slate-200">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-slate-500" />
                                    <SelectValue placeholder="Category" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                {CATEGORIES.map(c => (
                                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {searchQuery && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSearchQuery(""); setFilterCategory("all"); }}
                                title="Clear filters"
                            >
                                <X className="h-4 w-4 text-slate-500" />
                            </Button>
                        )}
                    </div>

                    {/* Grid */}
                    {filteredVideos.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300">
                            <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                                <Search className="h-8 w-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700">No videos found</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2">
                                Try adjusting your search or upload a new video to get started.
                            </p>
                            <Button
                                variant="link"
                                onClick={() => { setSearchQuery(""); setFilterCategory("all"); }}
                                className="mt-2 text-teal-600"
                            >
                                Clear filters
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredVideos.map((video) => {
                                const cat = getCategoryBadge(video.category);
                                return (
                                    <Card key={video.id} className="group overflow-hidden border-slate-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                                        <div className="relative aspect-video bg-slate-900 group-hover:scale-[1.01] transition-transform duration-500">
                                            {video.thumbnail_url ? (
                                                <img
                                                    src={video.thumbnail_url}
                                                    alt={video.title}
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-60 transition-opacity duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                                                    <Film className="h-12 w-12 text-white/20" />
                                                </div>
                                            )}

                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                    <Play className="h-6 w-6 text-white ml-1" />
                                                </div>
                                            </div>

                                            {/* Status Badge */}
                                            <div className="absolute top-3 left-3 flex gap-2">
                                                {!video.is_published && (
                                                    <Badge variant="secondary" className="bg-amber-100/90 text-amber-800 backdrop-blur-sm shadow-sm">
                                                        Draft
                                                    </Badge>
                                                )}
                                                <Badge className={cn("bg-white/90 backdrop-blur-sm shadow-sm border-0", cat.color)}>
                                                    {cat.label}
                                                </Badge>
                                            </div>

                                            {/* Duration */}
                                            {video.duration_seconds && (
                                                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-1 rounded-md flex items-center gap-1 shadow-sm">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDuration(video.duration_seconds)}
                                                </div>
                                            )}
                                        </div>

                                        <CardContent className="p-5">
                                            <h3 className="font-bold text-slate-900 line-clamp-1 mb-1 group-hover:text-teal-700 transition-colors">
                                                {video.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 line-clamp-2 min-h-[40px] mb-4">
                                                {video.description || "No description provided."}
                                            </p>

                                            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                                <div className="flex items-center text-xs text-slate-500 font-medium">
                                                    <Eye className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                                    {video.views_count} views
                                                </div>

                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className={cn(
                                                            "h-8 w-8 p-0 rounded-lg",
                                                            video.is_published ? "text-teal-600 bg-teal-50" : "text-slate-400 hover:text-slate-600"
                                                        )}
                                                        onClick={() => togglePublished(video)}
                                                        title={video.is_published ? "Unpublish" : "Publish"}
                                                    >
                                                        {video.is_published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-lg text-blue-600 hover:bg-blue-50"
                                                        onClick={() => openEditDialog(video)}
                                                        title="Edit"
                                                    >
                                                        <Edit3 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 rounded-lg text-red-600 hover:bg-red-50"
                                                        onClick={() => handleDelete(video.id)}
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                {/* TAB 2: UPLOAD VIDEO */}
                <TabsContent value="upload" className="animate-in slide-in-from-right-2 duration-300">
                    <Card className="max-w-4xl mx-auto border-slate-200 shadow-lg">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
                                <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                                    <CloudUploadIcon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Upload New Video</h2>
                                    <p className="text-sm text-slate-500">Share your expertise with your patients</p>
                                </div>
                            </div>

                            <VideoForm />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Edit Dialog (Reuses VideoForm Logic) */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Edit3 className="h-5 w-5 text-teal-600" />
                            Edit Video Details
                        </DialogTitle>
                    </DialogHeader>
                    <div className="mt-4">
                        <VideoForm />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Icon helper
function CloudUploadIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            fill="none"
            height="24"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            width="24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M12 12v9" />
            <path d="m16 16-4-4-4 4" />
        </svg>
    );
}
