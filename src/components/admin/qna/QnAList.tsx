"use client";

import { useEffect, useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import { QnADialog, QnAItem } from "./QnADialog";
import { Search, Plus, MoreHorizontal, Pencil, Trash2, FileText, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function QnAList() {
    const [items, setItems] = useState<QnAItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<QnAItem | null>(null);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('clinical_qna')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching QnA:', error);
            // toast.error("Failed to fetch QnA items");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchItems();

        const channel = supabase
            .channel('clinical_qna_list')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'clinical_qna' },
                () => fetchItems()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this QnA entry?")) return;

        try {
            const { error } = await supabase
                .from('clinical_qna')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success("Entry deleted");
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error("Failed to delete entry");
        }
    };

    const handleEdit = (item: QnAItem) => {
        setSelectedItem(item);
        setDialogOpen(true);
    };

    const handleCreate = () => {
        setSelectedItem(null);
        setDialogOpen(true);
    };

    const filteredItems = items.filter(item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search questions..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button onClick={handleCreate} className="gap-2 bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4" />
                    Add Question
                </Button>
            </div>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                        <FileText className="h-5 w-5 text-purple-500" />
                        Knowledge Base
                    </CardTitle>
                    <CardDescription>
                        Manage clinical questions and answers for the AI and doctors.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[400px]">Question</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="hidden md:table-cell">Tags</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : filteredItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                            No entries found. Create one to get started.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                                <div className="line-clamp-2" title={item.question}>{item.question}</div>
                                                <div className="text-xs text-muted-foreground mt-1 line-clamp-1">{item.answer}</div>
                                            </TableCell>
                                            <TableCell className="capitalize">
                                                <Badge variant="outline">{item.category}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {item.is_published ? (
                                                    <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Published
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                                                        <XCircle className="h-3.5 w-3.5" />
                                                        Draft
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <div className="flex flex-wrap gap-1">
                                                    {item.tags?.slice(0, 3).map(tag => (
                                                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                                                            {tag}
                                                        </Badge>
                                                    ))}
                                                    {item.tags?.length > 3 && (
                                                        <span className="text-xs text-muted-foreground">+{item.tags.length - 3}</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => item.id && handleDelete(item.id)}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <QnADialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                initialData={selectedItem}
                onSave={fetchItems}
            />
        </div>
    );
}
