"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, ShieldAlert } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface FlaggedSession {
    id: string;
    consultation_id: string;
    flag_type: string;
    severity: 'low' | 'medium' | 'high' | 'urgent';
    description: string;
    status: string;
    created_at: string;
    user?: {
        email: string;
    };
}

interface FlaggedSessionDialogProps {
    session: FlaggedSession | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onStatusChange: () => void;
}

export function FlaggedSessionDialog({
    session,
    open,
    onOpenChange,
    onStatusChange
}: FlaggedSessionDialogProps) {
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);

    if (!session) return null;

    const handleAction = async (newStatus: 'resolved' | 'dismissed') => {
        try {
            setLoading(true);
            const { error } = await supabase
                .from('flagged_sessions')
                .update({
                    status: newStatus,
                    resolution_notes: notes,
                    resolved_at: new Date().toISOString(),
                    resolved_by: (await supabase.auth.getUser()).data.user?.id
                })
                .eq('id', session.id);

            if (error) throw error;

            toast.success(`Flag ${newStatus === 'resolved' ? 'resolved' : 'dismissed'} successfully`);
            onStatusChange();
            onOpenChange(false);
            setNotes("");
        } catch (error) {
            console.error('Error updating flag:', error);
            toast.error("Failed to update flag status");
        } finally {
            setLoading(false);
        }
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'urgent': return 'bg-red-500 hover:bg-red-600';
            case 'high': return 'bg-orange-500 hover:bg-orange-600';
            case 'medium': return 'bg-yellow-500 hover:bg-yellow-600';
            case 'low': return 'bg-blue-500 hover:bg-blue-600';
            default: return 'bg-slate-500';
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${getSeverityColor(session.severity)} text-white border-0`}>
                            {session.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                            {session.flag_type}
                        </Badge>
                    </div>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <ShieldAlert className="h-5 w-5 text-red-500" />
                        Compliance Review
                    </DialogTitle>
                    <DialogDescription>
                        Review details for flagged session ID: {session.id.slice(0, 8)}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">User Email</Label>
                            <p className="text-sm font-medium">{session.user?.email || 'Unknown'}</p>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs text-muted-foreground">Flagged At</Label>
                            <p className="text-sm font-medium">
                                {format(new Date(session.created_at), "PPP p")}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Flag Description</Label>
                        <div className="p-3 bg-slate-50 border rounded-md text-sm text-slate-700">
                            {session.description || "No description provided."}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Resolution Notes</Label>
                        <Textarea
                            placeholder="Add notes about your decision..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                        variant="outline"
                        onClick={() => handleAction('dismissed')}
                        disabled={loading}
                        className="gap-2 text-slate-600"
                    >
                        <XCircle className="h-4 w-4" />
                        Dismiss Flag
                    </Button>
                    <Button
                        onClick={() => handleAction('resolved')}
                        disabled={loading || !notes.trim()}
                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                    >
                        <CheckCircle className="h-4 w-4" />
                        Resolve Issue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
