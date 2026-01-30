"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface QnAItem {
    id?: string;
    question: string;
    answer: string;
    category: string;
    tags: string[];
    is_published: boolean;
}

interface QnADialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: QnAItem | null;
    onSave: () => void;
}

const CATEGORIES = [
    { value: "general", label: "General Medicine" },
    { value: "cardiology", label: "Cardiology" },
    { value: "neurology", label: "Neurology" },
    { value: "pediatrics", label: "Pediatrics" },
    { value: "dermatology", label: "Dermatology" },
    { value: "other", label: "Other" },
];

export function QnADialog({
    open,
    onOpenChange,
    initialData,
    onSave
}: QnADialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<QnAItem>({
        question: "",
        answer: "",
        category: "general",
        tags: [],
        is_published: false,
    });
    const [tagInput, setTagInput] = useState("");

    useEffect(() => {
        if (initialData) {
            setFormData(initialData);
        } else {
            setFormData({
                question: "",
                answer: "",
                category: "general",
                tags: [],
                is_published: false,
            });
        }
    }, [initialData, open]);

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(tagInput.trim())) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
            }
            setTagInput("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }));
    };

    const handleSubmit = async () => {
        if (!formData.question.trim() || !formData.answer.trim()) {
            toast.error("Question and Answer are required");
            return;
        }

        try {
            setLoading(true);
            const user = (await supabase.auth.getUser()).data.user;

            if (initialData?.id) {
                // Update
                const { error } = await supabase
                    .from('clinical_qna')
                    .update({
                        ...formData,
                        updated_by: user?.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', initialData.id);
                if (error) throw error;
                toast.success("QnA updated successfully");
            } else {
                // Create
                const { error } = await supabase
                    .from('clinical_qna')
                    .insert([{
                        ...formData,
                        created_by: user?.id,
                        updated_by: user?.id
                    }]);
                if (error) throw error;
                toast.success("QnA created successfully");
            }

            onSave();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving QnA:', error);
            toast.error("Failed to save QnA");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{initialData ? 'Edit Question' : 'Add New Question'}</DialogTitle>
                    <DialogDescription>
                        Create or modify clinical knowledge base entries.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Question</Label>
                        <Input
                            placeholder="e.g., What are the symptoms of..."
                            value={formData.question}
                            onChange={(e) => setFormData(prev => ({ ...prev, question: e.target.value }))}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Answer</Label>
                        <Textarea
                            placeholder="Provide a detailed clinical answer..."
                            className="min-h-[150px]"
                            value={formData.answer}
                            onChange={(e) => setFormData(prev => ({ ...prev, answer: e.target.value }))}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                                value={formData.category}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 flex flex-col justify-end pb-2">
                            <div className="flex items-center justify-between border p-3 rounded-md">
                                <Label className="cursor-pointer" htmlFor="published-mode">
                                    Published
                                </Label>
                                <Switch
                                    id="published-mode"
                                    checked={formData.is_published}
                                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tags (Press Enter to add)</Label>
                        <Input
                            placeholder="Add tags..."
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleAddTag}
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                    {tag}
                                    <X
                                        className="h-3 w-3 cursor-pointer hover:text-red-500"
                                        onClick={() => removeTag(tag)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="gap-2">
                        <Save className="h-4 w-4" />
                        Save Entry
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
